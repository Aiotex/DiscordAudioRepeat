const { Client, GatewayIntentBits } = require('discord.js');
const { joinVoiceChannel, EndBehaviorType, AudioPlayerStatus, StreamType, createAudioPlayer, createAudioResource, getVoiceConnection, NoSubscriberBehavior, PlayerSubscription, AudioReceiveStream } = require("@discordjs/voice");
const { OpusEncoder } = require( "@discordjs/opus" ); 
const dotenv = require("dotenv");
const AudioMixer = require('audio-mixer');
const fs = require('fs');
dotenv.config();

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildVoiceStates],
});

client.on("ready", () => {
  console.log(`the bot is online!`);
});

client.on("messageCreate", (message) => {
    if(message.author.id != "501819491764666386") return;
    const voicechannel = message.member.voice.channel;
    if(!voicechannel) return message.channel.send("Please join a vc");
    joinVoiceChannel({
        channelId: voicechannel.id,
        guildId: message.guild.id,
        adapterCreator: message.guild.voiceAdapterCreator,
        selfDeaf: false,
        selfMute: false
    });

    let connection = getVoiceConnection(message.guild.id);
    let receiver = connection.receiver;

    const encoder = new OpusEncoder(48000, 2);
    const mixer = new AudioMixer.Mixer({channels: 2, bitDepth: 16, sampleRate: 48000, clearInterval: 250});

    receiver.speaking.on("start", (user) => { playStream(user) });
  
    // Audio player
    const audioPlayer = createAudioPlayer();
    const resource = createAudioResource(mixer, { inputType: StreamType.Raw, });
    connection.subscribe(audioPlayer);
    audioPlayer.play(resource);
    
    audioPlayer.on(AudioPlayerStatus.Idle, () => {
        console.log('player idle');
        audioPlayer.stop();
    });

    function playStream(userId) {
        const audioStream = receiver.subscribe(userId, { end: { behavior: EndBehaviorType.AfterSilence, duration: 200 } });
        const input = mixer.input({ volume: 75 });
    
        audioStream
            .on("data", (chunk) => {
                const buffer = encoder.decode(chunk);
                input.write(buffer);
            })
            .on("error", (err) => {
                console.log(err)
            })
            .on("end", () => {
                audioStream.destroy();
                mixer.removeInput(input);
            });
    }
});

client.login(process.env.TOKEN);
