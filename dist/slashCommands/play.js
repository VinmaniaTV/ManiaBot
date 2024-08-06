"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.command = void 0;
const discord_js_1 = require("discord.js");
const voice_1 = require("@discordjs/voice");
const youtube_dl_exec_1 = __importDefault(require("youtube-dl-exec"));
const ytdl_core_1 = __importDefault(require("ytdl-core"));
const youtube_sr_1 = __importDefault(require("youtube-sr"));
exports.command = {
    name: 'play',
    data: new discord_js_1.SlashCommandBuilder()
        .setName('play')
        .setDescription('Diffuse de la musique dans un salon vocal actuel ou ajoute une musique à la file d\'attente.')
        .addStringOption((option) => {
        return option.setName('nom')
            .setDescription('Le nom de la musique à jouer ou url YouTube.')
            .setRequired(true);
    }),
    execute: async (interaction) => {
        let youtubeUrl = interaction.options.get('nom')?.value;
        if (!validURL(youtubeUrl)) {
            await youtube_sr_1.default.search(youtubeUrl, { limit: 5, type: 'video' })
                .then(async (results) => {
                if (results.length === 0) {
                    await interaction.reply({ content: 'Aucun résultat trouvé.', ephemeral: true });
                    return;
                }
                youtubeUrl = results[0].url;
            });
        }
        const member = interaction.guild?.members.cache.get(interaction.user.id);
        const channel = member?.voice.channel;
        if (!channel) {
            await interaction.reply({ content: 'Vous devez être connecté à un salon vocal pour utiliser cette commande.', ephemeral: true });
            return;
        }
        const queue = await getQueue(interaction);
        let connection;
        console.log(queue.player.state.status);
        if (!queue.connection || queue.connection.state.status === 'destroyed') {
            connection = (0, voice_1.joinVoiceChannel)({
                channelId: channel.id,
                guildId: channel.guild.id,
                adapterCreator: channel.guild.voiceAdapterCreator,
                selfDeaf: false
            });
            connection.subscribe(queue.player);
            global.queueSongs.find(q => q.voiceChannel.id === channel.id).connection = connection;
        }
        else {
            connection = queue.connection;
        }
        interaction.deferReply();
        const youtubeContent = await (0, youtube_dl_exec_1.default)(youtubeUrl, {
            dumpSingleJson: true,
            noCheckCertificates: true,
            noWarnings: true,
            preferFreeFormats: true,
            keepVideo: false,
            addHeader: ['referer:youtube.com', 'user-agent:googlebot']
        });
        // Fetch video info
        let videoId = ytdl_core_1.default.getURLVideoID(youtubeUrl);
        let info = await ytdl_core_1.default.getInfo(videoId);
        //get the best audio format available
        const bestAudioFormat = youtubeContent.formats.find((format) => format.ext === 'm4a');
        let song = {
            title: info.videoDetails.title,
            url: bestAudioFormat.url,
            thumbnail: info.videoDetails.thumbnails[0].url,
            duration: parseInt(info.videoDetails.lengthSeconds),
            requester: interaction.user.tag,
            resource: (0, voice_1.createAudioResource)(bestAudioFormat.url)
        };
        const isAddedToQueueMessage = await addSong(interaction, song);
        const hours = Math.floor(song.duration / 3600);
        const minutes = Math.floor((song.duration % 3600) / 60);
        const seconds = song.duration % 60;
        if (isAddedToQueueMessage) {
            await interaction.editReply({
                embeds: [
                    new discord_js_1.EmbedBuilder()
                        .setTitle('Musique ajoutée à la file d\'attente')
                        .setDescription(`**${song.title}** a été ajouté à la file d'attente.`)
                        .setThumbnail(song.thumbnail)
                        .addFields({ name: 'Durée', value: `${hours > 0 ? hours + ':' : ''}${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}` }, { name: 'Demandé par', value: song.requester })
                ]
            });
        }
        else {
            await interaction.editReply({
                embeds: [
                    new discord_js_1.EmbedBuilder()
                        .setTitle('Lecture de la musique')
                        .setDescription(`**${song.title}** est en train d'être joué.`)
                        .setThumbnail(song.thumbnail)
                        .addFields({ name: 'Durée', value: `${hours > 0 ? hours + ':' : ''}${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}` }, { name: 'Demandé par', value: song.requester })
                ]
            });
        }
    }
};
function validURL(str) {
    var pattern = new RegExp('^(https?:\\/\\/)?' + // protocol
        '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // domain name
        '((\\d{1,3}\\.){3}\\d{1,3}))' + // OR ip (v4) address
        '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // port and path
        '(\\?[;&a-z\\d%_.~+=-]*)?' + // query string
        '(\\#[-a-z\\d_]*)?$', 'i'); // fragment locator
    return !!pattern.test(str);
}
// Get queue if exists and create if not
async function getQueue(interaction) {
    const member = interaction.guild?.members.cache.get(interaction.user.id);
    const voiceChannel = member?.voice.channelId ? await interaction.guild?.channels.fetch(member.voice.channelId) : null;
    let queue = global.queueSongs.find(q => q.voiceChannel.id === voiceChannel.id);
    if (!queue) {
        queue = {
            guildId: interaction.guild?.id,
            voiceChannel: voiceChannel,
            connection: (0, voice_1.joinVoiceChannel)({
                channelId: voiceChannel.id,
                guildId: voiceChannel.guild.id,
                adapterCreator: voiceChannel.guild.voiceAdapterCreator,
                selfDeaf: false
            }),
            songs: [],
            volume: 1,
            playing: false,
            player: (0, voice_1.createAudioPlayer)({
                behaviors: {
                    noSubscriber: voice_1.NoSubscriberBehavior.Pause,
                    maxMissedFrames: 10,
                }
            })
        };
        queue.connection.subscribe(queue.player);
        queue.player.on(voice_1.AudioPlayerStatus.Playing, () => {
            console.log('La musique joue.');
        });
        queue.player.on(voice_1.AudioPlayerStatus.Idle, () => {
            console.log('La musique est terminée.');
            queue.songs.shift();
            if (queue.songs.length > 0) {
                const resource = queue.songs[0].resource;
                queue.player.play(resource);
            }
            else {
                queue.connection.destroy();
            }
        });
        queue.player.on('error', error => {
            console.error('Error:', error.message, 'with track', error.resource);
            queue.connection.destroy();
        });
        global.queueSongs.push(queue);
    }
    return queue;
}
// Add a song to the queue and return if the son is the only one
async function addSong(interaction, song) {
    global.queueSongs[global.queueSongs.findIndex(q => q.guildId === interaction.guildId)].songs.push(song);
    if (global.queueSongs.find(q => q.guildId === interaction.guildId).songs.length === 1) {
        const resource = global.queueSongs.find(q => q.guildId === interaction.guildId).songs[0].resource;
        global.queueSongs.find(q => q.guildId === interaction.guildId).player.play(resource);
        return false;
    }
    return global.queueSongs.find(q => q.guildId === interaction.guildId).songs.length !== 1;
}
