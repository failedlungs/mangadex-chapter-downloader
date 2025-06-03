const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

const BASE_API_URL = 'https://api.mangadex.org';

async function downloadMangaChapter(chapterId) {
    if (!chapterId) {
        console.error('Error: Please provide a chapter ID.');
        console.log('Usage: node index.js <chapter-id>');
        return;
    }

    try {
        console.log(`Fetching chapter data for chapter ID: ${chapterId}...`);
        const response = await axios.get(`${BASE_API_URL}/at-home/server/${chapterId}`);

        if (response.data.result !== 'ok') {
            console.error('Error: Could not retrieve chapter data.', response.data);
            return;
        }

        const { baseUrl, chapter } = response.data;
        const { hash, data: filenames } = chapter;

        const chapterDir = path.join(__dirname, 'downloads', chapterId);
        await fs.ensureDir(chapterDir); // Create the directory if it doesn't exist

        console.log(`Downloading ${filenames.length} images to: ${chapterDir}`);

        for (let i = 0; i < filenames.length; i++) {
            const filename = filenames[i];
            const imageUrl = `${baseUrl}/data/${hash}/${filename}`;
            const imagePath = path.join(chapterDir, filename);

            try {
                console.log(`Downloading image ${i + 1}/${filenames.length}: ${filename}`);
                const imageResponse = await axios({
                    method: 'GET',
                    url: imageUrl,
                    responseType: 'stream' // Important for downloading binary data
                });

                const writer = fs.createWriteStream(imagePath);
                imageResponse.data.pipe(writer);

                await new Promise((resolve, reject) => {
                    writer.on('finish', resolve);
                    writer.on('error', reject);
                });
                console.log(`Successfully downloaded: ${filename}`);
            } catch (imageError) {
                console.error(`Error downloading image ${filename}:`, imageError.message);
            }
        }

        console.log(`\nAll images for chapter ${chapterId} downloaded successfully!`);

    } catch (error) {
        if (error.response) {
            console.error(`Error: MangaDex API responded with status ${error.response.status} - ${error.response.data.result}`);
            console.error('Details:', error.response.data);
        } else if (error.request) {
            console.error('Error: No response received from MangaDex API. Check your internet connection or the API URL.');
        } else {
            console.error('Error:', error.message);
        }
    }
}

// Get chapter ID from command line arguments
const chapterId = process.argv[2];
downloadMangaChapter(chapterId);