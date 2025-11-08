import { Client, GatewayIntentBits, Collection } from "discord.js";
import fs from "fs";
import path from "path";

const config = JSON.parse(fs.readFileSync("./config.js", "utf8"));
const client = new Client({ intents: [GatewayIntentBits.Guilds] });
client.commands = new Collection();

// Komutları yükle
const commandFiles = fs.readdirSync("./commands").filter(file => file.endsWith(".js"));
for (const file of commandFiles) {
    const { default: command } = await import(`./commands/${file}`);
    client.commands.set(command.data.name, command);
}

client.once("ready", () => {
    console.log(`✅ ${client.user.tag} aktif!`);
});

client.on("interactionCreate", async interaction => {
    if (!interaction.isChatInputCommand()) return;
    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
        await command.execute(interaction, client);
    } catch (error) {
        console.error(error);
        await interaction.reply({ content: "❌ Komut çalıştırılırken hata oluştu.", ephemeral: true });
    }
});

client.login(config.token);
