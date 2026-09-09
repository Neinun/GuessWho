const axios = require('axios');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const CELEBRITIES = [
    "Leonardo DiCaprio", "Brad Pitt", "Tom Cruise", "Will Smith", "Johnny Depp",
    "Robert Downey Jr.", "Chris Hemsworth", "Chris Evans", "Scarlett Johansson", "Jennifer Lawrence",
    "Angelina Jolie", "Tom Hanks", "Denzel Washington", "Morgan Freeman", "Samuel L. Jackson",
    "Keanu Reeves", "Hugh Jackman", "Ryan Reynolds", "Dwayne Johnson", "Jackie Chan",
    "Arnold Schwarzenegger", "Sylvester Stallone", "Bruce Willis", "Matt Damon", "Ben Affleck",
    "George Clooney", "Harrison Ford", "Al Pacino", "Robert De Niro", "Clint Eastwood",
    "Meryl Streep", "Julia Roberts", "Sandra Bullock", "Nicole Kidman", "Natalie Portman",
    "Emma Stone", "Anne Hathaway", "Charlize Theron", "Margot Robbie", "Gal Gadot",
    "Taylor Swift", "Beyonce", "Rihanna", "Lady Gaga", "Ariana Grande",
    "Selena Gomez", "Katy Perry", "Justin Bieber", "Ed Sheeran", "Drake"
];

const ASSETS_DIR = path.join(__dirname, '../assets/celebrities');
const JSON_PATH = path.join(__dirname, '../assets/celebrities.json');

async function fetchImageForCelebrity(name) {
    try {
        const url = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(name)}&prop=pageimages&format=json&pithumbsize=400`;
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'GuessWhoGameBot/1.0 (contact@example.com)'
            }
        });
        const pages = response.data.query.pages;
        const pageId = Object.keys(pages)[0];
        
        if (pageId === "-1" || !pages[pageId].thumbnail) {
            console.log(`No image found for ${name}`);
            return null;
        }
        
        return pages[pageId].thumbnail.source;
    } catch (error) {
        console.error(`Error fetching image URL for ${name}:`, error.message);
        return null;
    }
}

async function downloadAndProcessImage(url, filename) {
    try {
        const response = await axios.get(url, { 
            responseType: 'arraybuffer',
            headers: {
                'User-Agent': 'GuessWhoGameBot/1.0 (contact@example.com)'
            }
        });
        const buffer = Buffer.from(response.data, 'binary');
        
        const outputPath = path.join(ASSETS_DIR, filename);
        
        await sharp(buffer)
            .resize(250, 250, { fit: 'cover', position: 'attention' })
            .webp({ quality: 80 })
            .toFile(outputPath);
            
        return true;
    } catch (error) {
        console.error(`Error downloading/processing image ${filename}:`, error.message);
        return false;
    }
}

async function main() {
    if (!fs.existsSync(ASSETS_DIR)) {
        fs.mkdirSync(ASSETS_DIR, { recursive: true });
    }

    const celebritiesList = [];
    let idCounter = 1;

    for (const name of CELEBRITIES) {
        console.log(`Processing ${name}...`);
        const imageUrl = await fetchImageForCelebrity(name);
        
        if (imageUrl) {
            const filename = `${name.replace(/\s+/g, '_').toLowerCase()}.webp`;
            const success = await downloadAndProcessImage(imageUrl, filename);
            
            if (success) {
                celebritiesList.push({
                    id: idCounter++,
                    name: name,
                    image: `celebrities/${filename}`
                });
                console.log(`Successfully processed ${name}`);
            }
        }
        
        // Respectful delay to avoid overwhelming Wikipedia API
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    fs.writeFileSync(JSON_PATH, JSON.stringify(celebritiesList, null, 2));
    console.log(`Completed. Processed ${celebritiesList.length} celebrities.`);
}

main();
