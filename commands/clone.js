import { SlashCommandBuilder } from "discord.js";
import fs from "fs";
import path from "path";
import fetch from "node-fetch";

export default {
    data: new SlashCommandBuilder()
        .setName("emoji-clone")
        .setDescription("Belirttiğiniz emojileri indirir ve dosyaya kaydeder.")
        .addStringOption(option =>
            option
                .setName("emojiler")
                .setDescription("Kopyalanacak emojileri girin (örn: :smile: :fire: :heart:)")
                .setRequired(true)
        )
        .addBooleanOption(option =>
            option
                .setName("random")
                .setDescription("Dosya adlarını rastgele mi oluşturayım? (varsayılan: sırayla)")
                .setRequired(false)
        ),

    async execute(interaction) {
        const emojiInput = interaction.options.getString("emojiler");
        const useRandom = interaction.options.getBoolean("random") || false;

        const emojiMatches = emojiInput.match(/<a?:\w+:\d+>/g);
        if (!emojiMatches || emojiMatches.length === 0) {
            return interaction.reply({
                content: "⚠️ Geçerli bir emoji bulunamadı! Lütfen özel Discord emojileri gir.",
                ephemeral: true
            });
        }

        // Klasör: kullanıcıya özel
        const dir = path.join("./emojis", `manual_selected_${interaction.user.id}`);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

        // 🔢 Mevcut dosyaları say ve en yüksek numarayı bul
        const files = fs.readdirSync(dir).filter(f => /^[0-9]+\.(png|gif|jpg)$/i.test(f));
        let startIndex = 1;

        if (files.length > 0) {
            const numbers = files.map(f => parseInt(f.match(/^([0-9]+)/)?.[1] || "0"));
            const maxNum = Math.max(...numbers);
            startIndex = maxNum + 1; // kaldığı yerden devam et
        }

        await interaction.reply(`📦 ${emojiMatches.length} emoji indirilmeye başlanıyor... (başlangıç: ${startIndex})`);

        const randomName = (len = 8) => {
            const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
            return Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
        };

        let i = 0;
        for (const match of emojiMatches) {
            i++;
            const animated = match.startsWith("<a:");
            const parts = match.split(":");
            const id = parts[2].replace(">", "");
            const ext = animated ? "gif" : "png";
            const url = `https://cdn.discordapp.com/emojis/${id}.${ext}`;

            // 🔠 Dosya ismini belirle (random veya kaldığı yerden)
            const fileIndex = startIndex + (i - 1);
            const fileName = useRandom ? `${randomName(10)}.${ext}` : `${fileIndex}.${ext}`;
            const filePath = path.join(dir, fileName);

            try {
                const res = await fetch(url);
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const buf = Buffer.from(await res.arrayBuffer());
                fs.writeFileSync(filePath, buf);

                console.log(`✅ ${fileName} kaydedildi (${i}/${emojiMatches.length})`);
                await new Promise(r => setTimeout(r, 2000)); // 2 saniye bekle
            } catch (err) {
                console.error(`❌ ${fileName} indirilemedi: ${err.message}`);
            }
        }

        await interaction.followUp(
            `🎉 ${emojiMatches.length} emoji kaydedildi!\n📁 Klasör: ${dir}\n🔢 Son dosya: ${startIndex + emojiMatches.length - 1}`
        );
    }
};
