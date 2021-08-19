from scraper.utils import ImageScraper, GeoJsonParser, GifCreator
import ftplib
import os
from dotenv import load_dotenv

GEOJSON_FILES = (
    'perseverance-current.json',
    'perseverance-waypoints.json',
    'perseverance-path.json',
    'ingenuity-current.json',
    'ingenuity-waypoints.json',
    'ingenuity-path.json'
)
GIFS_PATH = 'gifs/'

def main():
    load_dotenv()

    print("Scraping images urls")
    image_scraper = ImageScraper()
    image_scraper.get()
    print("Updating images.json")
    image_scraper.run()

    print("Parsing GeoJSON files")
    geojson_parser = GeoJsonParser()
    geojson_parser.run()

    print("Downloading gif images")
    gif_creator = GifCreator()
    gif_creator.get()
    print("Creating flight gifs")
    gif_creator.run()

    print("Uploading files to server")
    ftp = ftplib.FTP(os.getenv("FTP_HOSTNAME"), os.getenv("FTP_USERNAME"), os.getenv("FTP_PASSWORD"))
    os.chdir('data')
    for filename in GEOJSON_FILES:
        with open(filename, "rb") as file:
            ftp.storbinary(f"STOR mars-20/api/geojson/{filename}", file)
    saved_gifs = ftp.nlst('mars-20/api/gifs')
    for filename in os.listdir(GIFS_PATH):
        if 'mars-20/api/gifs/' + filename not in saved_gifs:
            with open(GIFS_PATH + filename, "rb") as file:
                ftp.storbinary(f"STOR mars-20/api/gifs/{filename}", file)
    ftp.quit()
    
    print("Done!")

if __name__ == "__main__":
    main()