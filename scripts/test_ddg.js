import { searchImages } from 'duck-duck-scrape';

async function run() {
  try {
    console.log("Searching for iPhone 16 Pro Max Desert Titanium...");
    const results = await searchImages("iPhone 16 Pro Max Desert Titanium front white background");
    console.log("Found results:", results.slice(0, 3));
  } catch (err) {
    console.error("Error searching:", err);
  }
}

run();
