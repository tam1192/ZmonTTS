'use strict';
const config = require('./config.json');

const path = require('path').join;
const {mkdirSync} = require('fs-extra');

const {Sequelize, DataTypes} = require('sequelize');
const voxClient = require('voxclient').Client;
const { Client, GatewayIntentBits } = require('discord.js');

const discordEvents = require('./modules/discordEvents');
const discordInteractions = require('./modules/discordCommands');


// Ctrl+Cでexitするようにする。
process.once('SIGINT', () => process.exit(0));
// exit
process.once('exit', () => {
	console.log('end');
});

// クライアントインスタンスの作成
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

client.db = new Sequelize({
	dialect: 'sqlite',
	storage: path(__dirname, 'db.sqlite'),
});

client.VoiceCache = client.db.define('VoiceCache', {
	id: {
		type: DataTypes.INTEGER,
		autoIncrement: true,
		primaryKey: true
	},
	content: {
		type: DataTypes.STRING,
		allowNull: false,
	},
	speaker: {
		type: DataTypes.INTEGER,
		allowNull: false,
	},
	counter: {
		type: DataTypes.INTEGER,
	}
});

client.UserData = client.db.define('UserData', {
	userid: {
		type: DataTypes.INTEGER,
		primaryKey: true
	},
	speaker: {
		type: DataTypes.INTEGER,
	},
});

client.CommandsData = client.db.define('BotData', {
		name: {
			type: DataTypes.STRING,
			primaryKey: true,
		},
		hash: {
			type: DataTypes.STRING,
			allowNull: false,
		}
});

client.db.sync();

client.tempdir=path(__dirname, 'tmp')

client.queue = [];

try{
	mkdirSync(client.tempdir);
}
catch(e){
	if(e.code!='EEXIST'){
		console.error(e);
		process.exit(1);
	}
}

client.voicevox = new voxClient(config.voicevox.address);
client.query = [];
// client.player = createAudioPlayer();
discordInteractions(client);

(async () => {
	await Promise.all([
		discordEvents(client),
		discordInteractions(client),
	]);

	// discordにログインする。
	await client.login(config.Discord.token);
})();