const { Client, GatewayIntentBits } = require('discord.js');
const { joinVoiceChannel, EndBehaviorType, AudioPlayerStatus, StreamType, createAudioPlayer, createAudioResource, getVoiceConnection, NoSubscriberBehavior } = require("@discordjs/voice");
const { OpusEncoder } = require( "@discordjs/opus" ); 
const dotenv = require("dotenv");
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
        selfDeaf: false
    });
    let connection = getVoiceConnection(message.guild.id);
    let connectedUsers = [];

    voicechannel.members.forEach((member) => {
        if(member.user.bot) return;
        connectedUsers.push(member.id);
    });

    client.on('voiceStateUpdate', (oldMember, newMember) => {
        console.log(oldMember, newMember)
        let newUserChannel = newMember.channel?.id;
        let oldUserChannel = oldMember.channel?.id;

        if(newMember.member.user.bot) return;

        if(newUserChannel === voicechannel.id) {
            if(connectedUsers.includes(newMember.id)) return;
            connectedUsers.push(newMember.id);
            listenAndRepeat(newMember.id);
        } else {
            connectedUsers = connectedUsers.filter(x => x != newMember.id);
        }
    });

    let talking;

    setInterval(() => {
        if(talking == null) {
            let speaking = Array.from(connection.receiver.speaking.users)?.toString().split(',')[0];
            talking = speaking == "" ? null : speaking;
            if(talking != null) initListeners();
        }
    }, 50);

    function initListeners() {
        connectedUsers.forEach(connectedUser => {
            listenAndRepeat(connectedUser);
        });
    }

    initListeners();

    function listenAndRepeat(userId) {
        if(talking != userId) {
            return;
        } else {
            talking = userId;
            const opusStream = connection.receiver.subscribe(userId, {
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
                    talking = null;
                    if(!connectedUsers.includes(userId)) return;
                    listenAndRepeat(userId);
                }, 10);
            });
        }
    }

    let cnt = 0;
    setInterval(() => {
        cnt++;
        console.log(connectedUsers, cnt);
    }, 500);
});

client.login(process.env.TOKEN);