// Wrapper class for Documenu API
// Searches for restaurants using '/restaurants/search/fields' and '/restaurants/search/geo'.
// Combines results from both searches.
// "Import" using 'var RestaurantSearch = require('./RestaurantSearch.js');'

// Mostly tested, but still a WIP, expect errors.
// In near future will add menu item searches.

const documenu = require('documenu');
documenu.configure('53cda3908899847343493dc14d62fd2c');

// Combines restaurant data from search data1 and search data2, removing duplicate restaurants
function combineData(data1, data2) {
	let codes = new Set();
	let data = data1.slice(0, data1.length);
	for (let i in data1) {
		codes.add(data1[i].restaurant_id);
	}
	for (let i in data2) {
		if (!codes.has(data2[i].restaurant_id)) {
			data.push(data2[i]);
		}
	}
	return data;
}

// Returns most common zip (postal) code from restaurant data
function findZip(data) {
	let zip_count = {};
	let max_count = -1;
	let zip;
	for (let i in data) {
		if (zip_count.hasOwnProperty(data[i].address.postal_code)) {
			zip_count[data[i].address.postal_code] += 1;
		} else {
			zip_count[data[i].address.postal_code] = 1;
		}
		if (zip_count[data[i].address.postal_code] > max_count) {
			max_count = zip_count[data[i].address.postal_code];
			zip = data[i].address.postal_code;
		}
	}
	return zip;
}

// Returns average coordinates from restaurant data
function findCoordinates(data) {
	let coordinates;
	let avg_lat = 0;
	let avg_lon = 0;
	for (let i in data) {
		avg_lat += data[i].geo.lat;
		avg_lon += data[i].geo.lon;
	}
	if (data.length > 0) {
		avg_lat /= data.length;
		avg_lon /= data.length;
		coordinates = {
			'lat' : avg_lat,
			'lon' : avg_lon
		}
	}
	return coordinates;
}

// Returns most common cuisine from restaurant data
function findCuisine(data) {
	let cuisine_count = {};
	let max_count = -1;
	let cuisine;
	for (let i in data) {
		for (let j in data[i].cuisines) {
			if (data[i].cuisines[j] != '') {
				if (cuisine_count.hasOwnProperty(data[i].cuisines[j])) {
				cuisine_count[data[i].cuisines[j]] += 1;
				} else {
					cuisine_count[data[i].cuisines[j]] = 1;
				}
				if (cuisine_count[data[i].cuisines[j]] > max_count) {
					max_count = cuisine_count[data[i].cuisines[j]];
					cuisine = data[i].cuisines[j];
				}
			}
		}
	}
	return cuisine;
}

// Searches radius around coordinates for restaurants with menu item
async function searchMenuItem(params) {
	let data = [];
	let codes = new Set();
	let search_data = (await documenu.MenuItems.searchGeo(params)).data;
	for (let i in search_data) {
		if (!codes.has(search_data[i].restaurant_id)) {
			data.push(search_data[i]);
			codes.add(search_data[i].restaurant_id);
		}
	}
	return data;
}

class RestaurantSearch {
	
	// Instantiation
	constructor() {
		this.params_fields = {
			exact : true,
			size : 10,
			page : 1
		};
		this.params_geo = {
			distance : 5,
			size : 10,
			page : 1
		};
		this.params_item = {
			distance : 5,
			size : 50,
			page : 1
		}
		this.has_coord = false;
		this.has_city_or_zip = false;
		this.has_cuisine = false;
		this.has_menu_item = false;
	}
	
	// Conducts search and returns data as an array of restaurant objects based on search parameters
	// Use '(RestaurantSearch object).search().then(res => {console.log(res);});' to see print array
	async search() {
		let data;
		if (this.has_coord) {
			let item_data = [];
			let geo_data;
			if (this.has_menu_item) {
				item_data = await searchMenuItem(this.params_item);
				if (!this.has_cuisine) {
					this.setCuisine(findCuisine(item_data));
					geo_data = (await documenu.Restaurants.searchGeo(this.params_geo)).data;
					this.setCuisine();
				} else {
					geo_data = (await documenu.Restaurants.searchGeo(this.params_geo)).data;
				}
			} else {
				geo_data = (await documenu.Restaurants.searchGeo(this.params_geo)).data;
			}
			let item_geo_data = combineData(item_data, geo_data);
			if (this.has_city_or_zip) {
				let fields_data = (await documenu.Restaurants.searchFields(this.params_fields)).data;
				data = combineData(item_geo_data, fields_data);
			} else {
				let zip = findZip(item_geo_data);
				if (zip !== undefined) {
					this.setZipCode(zip);
					let fields_data = (await documenu.Restaurants.searchFields(this.params_fields)).data;
					data = combineData(item_geo_data, fields_data);
					this.setZipCode();
				} else {
					data = item_geo_data.slice(0, item_geo_data.length);
				}
			}
		} else {
			let fields_data = (await documenu.Restaurants.searchFields(this.params_fields)).data;
			if (this.has_city_or_zip) {
				let coordinates = findCoordinates(fields_data);
				if (coordinates !== undefined) {
					this.setCoordinates(coordinates['lat'], coordinates['lon']);
					if (this.has_menu_item) {
						let item_data = await searchMenuItem(this.params_item);
						let geo_data;
						if (!this.has_cuisine) {
							this.setCuisine(findCuisine(item_data));
							fields_data = (await documenu.Restaurants.searchFields(this.params_fields)).data;
							geo_data = (await documenu.Restaurants.searchGeo(this.params_geo)).data;
							this.setCuisine();
						} else {
							geo_data = (await documenu.Restaurants.searchGeo(this.params_geo)).data;
						}
						data = combineData(item_data, fields_data);
						data = combineData(data, geo_data);
					} else {
						geo_data = (await documenu.Restaurants.searchGeo(this.params_geo)).data;
						data = combineData(fields_data, geo_data);
					}
					this.setCoordinates();
				} else {
					data = fields_data.slice(0, fields_data.length);
				}
			} else {
				data = fields_data.slice(0, fields_data.length);
			}
		}
		return data;
	}
	
	// Sets coordinates of area to search, resets when given no arguments
	setCoordinates(lat = undefined, lon = undefined) {
		if (lat === undefined || lon === undefined) {
			delete this.params_geo.lat;
			delete this.params_geo.lon;
			delete this.params_item.lat;
			delete this.params_item.lon;
			this.has_coord = false;
		} else {
			this.params_geo.lat = lat;
			this.params_geo.lon = lon;
			this.params_item.lat = lat;
			this.params_item.lon = lon;
			this.has_coord = true;
		}
	}
	
	// Sets radius of search around coordinates (in miles), resets to 5 when given no arguments
	setDistance(miles = 5) {
		this.params_geo.distance = miles;
		this.params_item.distance = miles;
	}
	
	// Sets cuisine of restaurants to search, resets when given no or empty argument
	setCuisine(cuisine) {
		if (cuisine === undefined || cuisine == '') {
			delete this.params_fields.restaurant_name;
			delete this.params_geo.cuisine;
			delete this.params_item.cuisine;
			this.has_cuisine = false;
		} else {
			this.params_fields.restaurant_name = cuisine;
			this.params_geo.cuisine = cuisine;
			this.params_item.cuisine = cuisine;
			this.has_cuisine = true;
		}
	}
	
	// Sets city of restaurants to search, resets when given no arguments
	setCity(city, stateCode) {
		if (city === undefined || stateCode === undefined) {
			delete this.params_fields.address;
			delete this.params_fields.state;
			this.has_city_or_zip = false;
		} else {
			this.params_fields.address = city;
			this.params_fields.state = stateCode;
			this.has_city_or_zip = true;
		}
	}
	
	// Sets zip code (postal code) of area to search, resets when given no arguments
	setZipCode(zipCode) {
		if (zipCode === undefined) {
			delete this.params_fields.zip_code;
			this.has_city_or_zip = false;
		} else {
			this.params_fields.zip_code = zipCode;
			this.has_city_or_zip = true;
		}
	}
	
	// Sets menu item to search, resets when given no arguments
	setMenuItem(item) {
		if (item === undefined) {
			delete this.params_item.search;
			this.has_menu_item = false;
		} else {
			this.params_item.search = item;
			this.has_menu_item = true;
		}
	}
	
}

module.exports = RestaurantSearch;