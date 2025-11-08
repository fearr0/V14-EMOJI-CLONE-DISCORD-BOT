import { REST, Routes } from "discord.js";
import fs from "fs";

const config = JSON.parse(fs.readFileSync("./config.js", "utf8"));
const commands = [];

const commandFiles = fs.readdirSync("./commands").filter(file => file.endsWith(".js"));
for (const file of commandFiles) {
    const { default: command } = await import(`./commands/${file}`);
    commands.push(command.data.toJSON());
}

const rest = new REST({ version: "10" }).setToken(config.token);

try {
    console.log("📡 Komutlar Discord'a yükleniyor...");
    await rest.put(
        Routes.applicationGuildCommands(config.clientID, config.guildID),
        { body: commands }
    );
    console.log("✅ Komutlar başarıyla yüklendi!");
} catch (err) {
    console.error("❌ Komut yükleme hatası:", err);
}
