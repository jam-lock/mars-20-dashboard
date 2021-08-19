from selenium import webdriver
from bs4 import BeautifulSoup
import requests
import json
from time import sleep
import urllib.request
from urllib.error import HTTPError
import os
import threading
from PIL import Image

ALL_IMAGES_PATH = "data/images-urls.json"
PARSED_IMAGES_PATH = "data/images.json"
PERSEVERANCE_CAM_TYPES = ['engineeringCameras', 'scienceCameras']
INGENUITY_CAM_TYPES = ['helicopterCameras']
IMAGES_DICT = {
    'engineeringCameras': {
        'navigationCameraLeft': "ncam/NLF",
        'navigationCameraRight': "ncam/NRF",
        'frontHazcamLeft': "fcam/FLF",
        'frontHazcamRight': "fcam/FRF",
        'rearHazcamLeft': "rcam/RLF",
        'rearHazcamRight': "rcam/RRF",
        'sampleCachingSystem': "cachecam/CCF"
    },
    'scienceCameras': {
        'mastcamZLeft': "zcam/ZL",
        'mastcamZRight': "zcam/ZR",
        'medaSkyCam': "meda/WSM",
        'pixlMicroContextCamera': "pixl/PC",
        'sherlocWatson': "shrlc/SIF",
        'sherlocContextImage': "shrlc/SC",
        'superCamRemoteMicroImager': "scam/LRF"
    },
    'helicopterCameras': {
        'navigationCamera': "heli/HNM",
        'colorCamera': "heli/HSF"
    }
}
GEOJSON_DATA = {
    "perseveranceCurrent": "https://mars.nasa.gov/mmgis-maps/M20/Layers/json/M20_waypoints_current.json",
    "perseveranceWaypoints": "https://mars.nasa.gov/mmgis-maps/M20/Layers/json/M20_waypoints.json",
    "perseverancePath": "https://mars.nasa.gov/mmgis-maps/M20/Layers/json/M20_traverse.json",
    "ingenuityCurrent": "https://mars.nasa.gov/mmgis-maps/M20/Layers/json/m20_heli_waypoints_current.json",
    "ingenuityWaypoints": "https://mars.nasa.gov/mmgis-maps/M20/Layers/json/m20_heli_waypoints.json",
    "ingenuityPath": "https://mars.nasa.gov/mmgis-maps/M20/Layers/json/m20_heli_flight_path.json",
}


def safe_insert(d, k1, k2, k3, l):
    try:
        d[k1][k2][k3] = l
    except KeyError:
        try:
            d[k1][k2] = {}
            safe_insert(d, k1, k2, k3, l)
        except KeyError:
            d[k1] = {}
            safe_insert(d, k1, k2, k3, l)
    return d


class ImageScraper():
    def __init__(self) -> None:
        options = webdriver.ChromeOptions()
        options.add_argument('headless')
        options.add_experimental_option('excludeSwitches', ['enable-logging'])
        self.driver = webdriver.Chrome(options=options)
        root_url = "https://mars.nasa.gov/mars2020/multimedia/raw-images/"
        self.driver.get(root_url)
        self.all_images = self.load(ALL_IMAGES_PATH)
        self.parsed_images = self.load(PARSED_IMAGES_PATH)
    
    def save(self, data, path):
        with open(path, 'w') as file:
            json.dump(data, file, indent=2)

    def load(self, path):
        try:
            with open(path, 'r') as file:
                return json.load(file)
        except FileNotFoundError:
            return []

    def get(self):
        page = 1
        i = 0
        while True:
            soup = BeautifulSoup(self.driver.page_source, "html.parser")
            images = soup.find_all("li", class_="raw_image_container")
            for image in images:
                thumbnail_src = image.find("img")['src']
                if thumbnail_src not in self.all_images:
                    self.all_images.append(thumbnail_src)
                    i = 0
                else:
                    i += 1
            next_page = self.driver.find_element_by_xpath('//*[@id="image-gallery"]/footer/div/div/div/nav/span[2]')
            if "disabled" in next_page.get_attribute('class') or i >= 10:
                break
            next_page.click()
            sleep(5)
            page += 1
        self.save(self.all_images, ALL_IMAGES_PATH)
    
    def filter_images(self, images, keyword):
        filtered_images = []
        for image in images:
            if keyword in image:
                filtered_images.append(image)
        return filtered_images

    def filter_sol_images(self, sol):
        imgs = []
        sol_str = "sol/" + f'{sol:05d}'
        for img in self.all_images:
            if sol_str in img:
                imgs.append(img)
        return imgs

    def run(self):
        images_by_sol = {}
        for sol in range(2, 999):
            filtered_sol_images = self.filter_sol_images(sol)
            cam_types = IMAGES_DICT.keys()
            for cam_type in cam_types:
                cams = IMAGES_DICT[cam_type].keys()
                for cam in cams:
                    cam_sol_images = self.filter_images(filtered_sol_images, IMAGES_DICT[cam_type][cam])
                    images_by_sol = safe_insert(images_by_sol, str(sol), cam_type, cam, cam_sol_images)
        self.save(images_by_sol, PARSED_IMAGES_PATH)


class GeoJsonParser():
    def __init__(self):
        self.perseverance_current = self.fetch(GEOJSON_DATA['perseveranceCurrent'])
        self.perseverance_waypoints = self.fetch(GEOJSON_DATA['perseveranceWaypoints'])
        self.perseverance_path = self.fetch(GEOJSON_DATA['perseverancePath'])
        self.ingenuity_current = self.fetch(GEOJSON_DATA['ingenuityCurrent'])
        self.ingenuity_waypoints = self.fetch(GEOJSON_DATA['ingenuityWaypoints'])
        self.ingenuity_path = self.fetch(GEOJSON_DATA['ingenuityPath'])
        with open(PARSED_IMAGES_PATH, 'r') as file:
            self.images = json.load(file)

    def save(self, data, path):
        with open(path, 'w') as file:
            json.dump(data, file, indent=2)

    def fetch(self, url):
        response = requests.get(url)
        return json.loads(response.content)

    def get_sol_images(self, sol):
        try:
            return self.images[str(sol)]
        except KeyError:
            return {}

    def get_agg_sol_images(self, initSol, endSol):
        agg_sol_images = {}
        for sol in range(initSol, endSol + 1):
            sol_images = self.get_sol_images(sol)
            for cam_type_key in sol_images:
                cams = sol_images[cam_type_key]
                for cam_key in cams:
                    try:
                        agg_sol_images[cam_type_key][cam_key] += sol_images[cam_type_key][cam_key]
                    except KeyError:
                        try:
                            agg_sol_images[cam_type_key][cam_key] = sol_images[cam_type_key][cam_key]
                        except KeyError:
                            agg_sol_images[cam_type_key] = {}
                            agg_sol_images[cam_type_key][cam_key] = sol_images[cam_type_key][cam_key]
        return agg_sol_images

    def filter_vehicle_images(self, vehicle, sol_images):
        vehicle_images = {}
        if vehicle == 'perseverance':
            for cam_type in PERSEVERANCE_CAM_TYPES:
                vehicle_images[cam_type] = sol_images[cam_type]
        elif vehicle == 'ingenuity':
            for cam_type in INGENUITY_CAM_TYPES:
                vehicle_images[cam_type] = sol_images[cam_type]
        return vehicle_images

    def get_sol_range_from_rmc(self, from_rmc, to_rmc):
        init_sol = [feature['properties']['sol'] for feature in self.perseverance_waypoints['features'] if feature['properties']['RMC'] == from_rmc]
        end_sol = [feature['properties']['sol'] for feature in self.perseverance_waypoints['features'] if feature['properties']['RMC'] == to_rmc]
        if len(init_sol) == 1 and len(end_sol) == 1:
            return [init_sol[0], end_sol[0]]
        else:
            return None

    def parse_perseverance_current(self):
        sol_images = self.get_sol_images(self.perseverance_current['features'][0]['properties']['sol'])
        vehicle_sol_images = self.filter_vehicle_images('perseverance', sol_images)
        self.perseverance_current['features'][0]['properties']['images'] = vehicle_sol_images
        self.save(self.perseverance_current, 'data/perseverance-current.json')

    def parse_perseverance_waypoints(self):
        for feature in self.perseverance_waypoints['features']:
            sol = feature['properties']['sol']
            if sol == 0:
                continue
            sol_images = self.get_sol_images(feature['properties']['sol'])
            vehicle_sol_images = self.filter_vehicle_images('perseverance', sol_images)
            feature['properties']['images'] = vehicle_sol_images
        self.save(self.perseverance_waypoints, 'data/perseverance-waypoints.json')

    def parse_perseverance_path(self):
        for index, feature in enumerate(self.perseverance_path['features']):
            from_rmc = feature['properties']['fromRMC']
            if not from_rmc:
                from_rmc = self.perseverance_path['features'][index - 1]['properties']['toRMC']
            to_rmc = feature['properties']['toRMC']
            if not to_rmc:
                to_rmc = self.perseverance_path['features'][index + 1]['properties']['fromRMC']
            init_sol, end_sol = self.get_sol_range_from_rmc(from_rmc, to_rmc)
            sol_images = self.get_agg_sol_images(init_sol, end_sol)
            vehicle_sol_images = self.filter_vehicle_images('perseverance', sol_images)
            feature['properties']['images'] = vehicle_sol_images
            feature['properties']['initSol'] = init_sol
            feature['properties']['endSol'] = end_sol
        self.save(self.perseverance_path, 'data/perseverance-path.json')

    def parse_ingenuity_current(self):
        sol_images = self.get_sol_images(self.ingenuity_current['features'][0]['properties']['sol'])
        vehicle_sol_images = self.filter_vehicle_images('ingenuity', sol_images)
        self.ingenuity_current['features'][0]['properties']['images'] = vehicle_sol_images
        self.save(self.ingenuity_current, "data/ingenuity-current.json")
    
    def parse_ingenuity_waypoints(self):
        for feature in self.ingenuity_waypoints['features']:
            sol_images = self.get_sol_images(feature['properties']['sol'])
            vehicle_sol_images = self.filter_vehicle_images('ingenuity', sol_images)
            feature['properties']['images'] = vehicle_sol_images
        self.save(self.ingenuity_waypoints, "data/ingenuity-waypoints.json")

    def parse_ingenuity_path(self):
        for feature in self.ingenuity_path['features']:
            sol_images = self.get_sol_images(feature['properties']['sol'])
            vehicle_sol_images = self.filter_vehicle_images('ingenuity', sol_images)
            feature['properties']['images'] = vehicle_sol_images
        self.save(self.ingenuity_path, "data/ingenuity-path.json")

    def run(self):
        self.parse_perseverance_current()
        self.parse_perseverance_waypoints()
        self.parse_perseverance_path()
        self.parse_ingenuity_current()
        self.parse_ingenuity_waypoints()
        self.parse_ingenuity_path()


class GifCreator():
    def __init__(self):
        self._RESULTS = []
        self._THREADS = []
        self.load()
    
    def load(self):
        with open('data/images.json', 'r') as file:
            self.images = json.load(file)

    def download(self, url, output):
        self._RESULTS.append(urllib.request.urlretrieve(url, output))

    def get_image(self, sol, url):
        filename = url.split('/')[-1]
        output = "data/gif-images/{}/{}".format(sol, filename)
        downloaded = os.path.isfile(output)
        if not os.path.isdir('data/gif-images'):
            os.mkdir('data/gif-images')
        if not os.path.isdir('data/gif-images/{}'.format(sol)):
            os.mkdir('data/gif-images/{}'.format(sol))
        if not downloaded:
            t = threading.Thread(target=self.download, args=(url, output))
            t.start()
            self._THREADS.append(t)
            return False
        return True
    
    def get(self):
        i = 0
        for sol in self.images:
            drone_images = self.images[sol]['helicopterCameras']['navigationCamera']
            for image_url in drone_images:
                already_downloaded = self.get_image(sol, image_url)
                if already_downloaded:
                    continue
                i += 1
                if i % 20 == 0:
                    sleep(2)
    
    def create_gif(self, frames, filename):
        frames[0].save(
            filename,
            format='GIF',
            append_images=frames[1:],
            save_all=True,
            duration=len(frames),
            loop=0
        )

    def run(self):
        sols = os.listdir('data/gif-images')
        for sol in sols:
            if not os.path.isdir('data/gifs'):
                os.mkdir('data/gifs')
            if '{}.gif'.format(sol) not in os.listdir('data/gifs'):
                flight_images = os.listdir('data/gif-images/{}'.format(sol))
                frames = []
                for img in flight_images:
                    new_frame = Image.open('data/gif-images/{}/{}'.format(sol, img))
                    frames.append(new_frame)
                self.create_gif(frames, 'data/gifs/{}.gif'.format(sol))
            