const { Client, GatewayIntentBits } = require('discord.js');
const { joinVoiceChannel, EndBehaviorType, AudioPlayerStatus, StreamType, createAudioPlayer, createAudioResource, getVoiceConnection, NoSubscriberBehavior } = require("@discordjs/voice");
const { OpusEncoder } = require( "@discordjs/opus" ); 
const dotenv = require("dotenv");
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
        adapterCreator: message.guild.voiceAdapterCreator
    });
    let connection = getVoiceConnection(message.guild.id);

    listenAndRepeat();
    function listenAndRepeat() {
        const opusStream = connection.receiver.subscribe(message.member.id, {
            end: {
                behavior: EndBehaviorType.Manual
            },
        });
        const audioPlayer = createAudioPlayer();
        connection.subscribe(audioPlayer);
        const resource = createAudioResource(opusStream, { inputType: StreamType.Opus });
        audioPlayer.play(resource);
    
        audioPlayer.on(AudioPlayerStatus.Idle, () => {
            audioPlayer.stop();
            opusStream.destroy();
            setTimeout(() => {
                listenAndRepeat();
            }, 10);
        });
    }
});

client.login(process.env.TOKEN);