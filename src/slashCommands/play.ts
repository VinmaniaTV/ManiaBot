import { CommandInteraction, EmbedBuilder, flatten, Interaction, SlashCommandBuilder, ThreadChannel } from "discord.js";
import { SlashCommand, Song, SongQueue } from "../types";
import { AudioPlayerStatus, createAudioPlayer, createAudioResource, joinVoiceChannel, NoSubscriberBehavior } from "@discordjs/voice";
import youtubedl, { Format } from "youtube-dl-exec";
import ytdl from "ytdl-core";

let queueList = Array<SongQueue>();

export const command: SlashCommand = {
    name: 'play',
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('Diffuse de la musique dans un salon vocal actuel ou ajoute une musique à la file d\'attente.')
        .addStringOption((option) => {
            return option.setName('youtubeurl')
            .setDescription('Le nom de la musique à jouer.')
            .setRequired(true);
        }),
        execute: async (interaction: CommandInteraction): Promise<void> => {
            const youtubeUrl = interaction.options.get('youtubeurl')?.value as string;
            
            if (!validURL(youtubeUrl)) {
                interaction.reply({ content: 'Veuillez fournir une URL valide.', ephemeral: true });
                return;
            }
    
            const member = interaction.guild?.members.cache.get(interaction.user.id);
            const channel = member?.voice.channel;
    
            if (!channel) {
                await interaction.reply({ content: 'Vous devez être connecté à un salon vocal pour utiliser cette commande.', ephemeral: true });
                return;
            }
    
            const queue = await getQueue(interaction);

            let connection;

            if (!queue.connection) {
                connection = joinVoiceChannel({
                    channelId: channel.id,
                    guildId: channel.guild.id,
                    adapterCreator: channel.guild.voiceAdapterCreator,
                    selfDeaf: false
                });
                queueList.find(q => q.voiceChannel.id === channel.id).connection = connection;
            } else {
                connection = queue.connection;
            }

            interaction.deferReply();

            const youtubeContent = await youtubedl(youtubeUrl, {
                dumpSingleJson: true,
                noCheckCertificates: true,
                noWarnings: true,
                preferFreeFormats: true,
                keepVideo: false,
                addHeader: ['referer:youtube.com', 'user-agent:googlebot']
            })

            // Fetch video info
            let videoId = ytdl.getURLVideoID(youtubeUrl);
            let info = await ytdl.getInfo(videoId);
            //console.log(info);
            ////const stream = ytdl.downloadFromInfo(info);
            //const stream = ytdl(youtubeUrl, { filter: format => format.hasVideo === false, quality: 'highestaudio' });
            //console.log(stream); 
            
            //get the best audio format available
            const bestAudioFormat = youtubeContent.formats.find((format: Format) => format.ext === 'm4a');
            //console.log(bestAudioFormat.url)
            
            let song: Song = {
                title: info.videoDetails.title,
                url: bestAudioFormat.url,
                thumbnail: info.videoDetails.thumbnails[0].url,
                duration: parseInt(info.videoDetails.lengthSeconds),
                requester: interaction.user.tag,
                resource: createAudioResource(bestAudioFormat.url)
            };

            const isAddedToQueueMessage = await addSong(interaction, song);
    
            //const stream = ytdl(youtubeUrl, { filter: 'audioonly' });
            //const resource = createAudioResource(stream);

            //let resource = createAudioResource('https://rr1---sn-25ge7nzr.googlevideo.com/videoplayback?expire=1722484745&ei=qbOqZsHGLoOpvdIP39CpqAE&ip=2a01%3Ae0a%3A1d%3Ac700%3A9de6%3A3c92%3Aa480%3A6859&id=o-AFUVNn3wdl9y7KGkje3mShEpJxwlZD-7jjVavYHLaDAk&itag=140&source=youtube&requiressl=yes&xpc=EgVo2aDSNQ%3D%3D&mh=hJ&mm=31%2C29&mn=sn-25ge7nzr%2Csn-25glenlk&ms=au%2Crdu&mv=m&mvi=1&pl=46&initcwndbps=955000&vprv=1&svpuc=1&mime=audio%2Fmp4&rqh=1&gir=yes&clen=4083640&dur=252.261&lmt=1712653867474717&mt=1722462771&fvip=4&keepalive=yes&c=IOS&txp=4532434&sparams=expire%2Cei%2Cip%2Cid%2Citag%2Csource%2Crequiressl%2Cxpc%2Cvprv%2Csvpuc%2Cmime%2Crqh%2Cgir%2Cclen%2Cdur%2Clmt&sig=AJfQdSswRQIgKBoZTKY3pHP1XQdxlCnl92pPiozDtEBSQUY5UwYOuzsCIQCCJkeneiZf31SNltBXz4nuTCH-7nBgr95f7GrBvHQf0g%3D%3D&lsparams=mh%2Cmm%2Cmn%2Cms%2Cmv%2Cmvi%2Cpl%2Cinitcwndbps&lsig=AGtxev0wRQIhAInq20hrnz4gWhXBreHtv1NrpOdzzpxXH4joSZeuNWApAiBdk2pu1w2vfURlBdqPo1B8i6hbdYvod75F23ZBdHGOoA%3D%3D');

            //let resource;
            //try {
            //    resource = createAudioResource(youtubeUrl, {
            //        inputType: StreamType.Arbitrary,
            //    });
            //} catch (error) {
            //    console.error('Error fetching the YouTube stream:', error);
            //    await interaction.reply({ content: 'Une erreur est survenue lors de la récupération du flux YouTube.', ephemeral: true });
            //    return;
            //}

            //let resource;
            //try {
            //    const stream = await ytdl(youtubeUrl, { filter: 'audioonly' });
            //    resource = createAudioResource(stream);
            //} catch (error) {
            //    console.error('Error fetching the YouTube stream:', error);
            //    await interaction.reply({ content: 'Une erreur est survenue lors de la récupération du flux YouTube.', ephemeral: true });
            //    return;
            //}
    
            if (isAddedToQueueMessage) {
                await interaction.editReply({
                    embeds: [
                        new EmbedBuilder()
                        .setTitle('Musique ajoutée à la file d\'attente')
                        .setDescription(`**${song.title}** a été ajouté à la file d'attente.`)
                        .setThumbnail(song.thumbnail)
                        .addFields(
                            { name: 'Durée', value: `${Math.floor(song.duration / 60)}:${song.duration % 60}` },
                            { name: 'Demandé par', value: song.requester }
                        )
                    ]
                })
            }
            else {
                await interaction.editReply({
                    embeds: [
                        new EmbedBuilder()
                        .setTitle('Lecture de la musique')
                        .setDescription(`**${song.title}** est en train d'être joué par ${interaction.user}.`)
                        .setThumbnail(song.thumbnail)
                        .addFields(
                            { name: 'Durée', value: `${Math.floor(song.duration / 60)}:${song.duration % 60}` },
                            { name: 'Demandé par', value: song.requester }
                        )
                    ]
                })
            }
        }
}

function validURL(str: string): boolean {
    var pattern = new RegExp('^(https?:\\/\\/)?' + // protocol
        '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // domain name
        '((\\d{1,3}\\.){3}\\d{1,3}))' + // OR ip (v4) address
        '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // port and path
        '(\\?[;&a-z\\d%_.~+=-]*)?' + // query string
        '(\\#[-a-z\\d_]*)?$', 'i'); // fragment locator
    return !!pattern.test(str);
}

// Get queue if exists and create if not
async function getQueue(interaction: CommandInteraction): Promise<SongQueue> {
    const member = interaction.guild?.members.cache.get(interaction.user.id);
    const voiceChannel: ThreadChannel = member?.voice.channelId ? await interaction.guild?.channels.fetch(member.voice.channelId) as ThreadChannel : null;
    let queue = queueList.find(q => q.voiceChannel.id === voiceChannel.id);
    if (!queue) {
        queue = {
            textChannel: interaction.channel,
            voiceChannel: voiceChannel,
            connection: joinVoiceChannel({
                channelId: voiceChannel.id,
                guildId: voiceChannel.guild.id,
                adapterCreator: voiceChannel.guild.voiceAdapterCreator,
                selfDeaf: false
            }),
            songs: [],
            volume: 1,
            playing: false,
            player: createAudioPlayer({
                behaviors: {
                    noSubscriber: NoSubscriberBehavior.Pause,
                    maxMissedFrames: 10,
                }
            })
        };

        queue.connection.subscribe(queue.player);

        queue.player.on(AudioPlayerStatus.Playing, () => {
            console.log('La musique joue.');
        });

        queue.player.on(AudioPlayerStatus.Idle, () => {
            console.log('La musique est terminée.');
            queue.songs.shift();
            if (queue.songs.length > 0) {
                const resource = queue.songs[0].resource;
                queue.player.play(resource);
            } else {
                queue.connection.destroy();
            }
        });

        queue.player.on('error', error => {
            console.error('Error:', error.message, 'with track', error.resource);
            queue.connection.destroy();
        });

        queueList.push(queue);
    }
    return queue;
}

// Add a song to the queue and return if the son is the only one
async function addSong(interaction: CommandInteraction, song: Song): Promise<Boolean> {
    queueList[queueList.findIndex(q => q.voiceChannel.id === interaction.guild?.members.cache.get(interaction.user.id)?.voice.channelId)].songs.push(song);
    if (queueList.find(q => q.voiceChannel.id === interaction.guild?.members.cache.get(interaction.user.id)?.voice.channelId).songs.length === 1) {
        const resource = queueList.find(q => q.voiceChannel.id === interaction.guild?.members.cache.get(interaction.user.id)?.voice.channelId).songs[0].resource;
        queueList.find(q => q.voiceChannel.id === interaction.guild?.members.cache.get(interaction.user.id)?.voice.channelId).player.play(resource);
        return false;
    }
    return queueList.find(q => q.voiceChannel.id === interaction.guild?.members.cache.get(interaction.user.id)?.voice.channelId).songs.length !== 1;
}