// Wrapper class for Documenu API
// Searches for restaurants using '/restaurants/search/fields' and '/restaurants/search/geo'.
// Combines results from both searches.
// "Import" using 'var RestaurantSearch = require('./RestaurantSearch.js');'

// Mostly tested, but still a WIP, expect errors.
// In near future will add menu item searches.

const documenu = require('documenu');
documenu.configure('b1c43411dbab1f3fa1c58961bab4013a');

// Combines restaurant data from search result1 and search result2, removing duplicate restaurants
function combineData(result1, result2) {
	let codes = new Set();
	let data = result1.data.slice(0, result1.data.length);
	for (let i in result1.data) {
		codes.add(result1.data[i].restaurant_id);
	}
	for (let i in result2.data) {
		if (!codes.has(result2.data[i].restaurant_id)) {
			data.push(result2.data[i]);
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
		this.has_coord = false;
		this.has_city_or_zip = false;
	}
	
	// Conducts search and returns data as an array of restaurant objects based on search parameters
	// Use '(RestaurantSearch object).search().then(res => {console.log(res);});' to see print array
	async search() {
		let data;
		if (this.has_coord) {
			let geo_result = await documenu.Restaurants.searchGeo(this.params_geo);
			if (this.has_city_or_zip) {
				let fields_result = await documenu.Restaurants.searchFields(this.params_fields);
				data = combineData(geo_result, fields_result);
			} else {
				let zip_count = {};
				let max_count = -1;
				let zip;
				for (let i in geo_result.data) {
					if (zip_count.hasOwnProperty(geo_result.data[i].address.postal_code)) {
						zip_count[geo_result.data[i].address.postal_code] += 1;
					} else {
						zip_count[geo_result.data[i].address.postal_code] = 1;
					}
					if (zip_count[geo_result.data[i].address.postal_code] > max_count) {
						max_count = zip_count[geo_result.data[i].address.postal_code];
						zip = geo_result.data[i].address.postal_code;
					}
				}
				if (geo_result.data.length > 0) {
					this.setZipCode(zip);
					let fields_result = await documenu.Restaurants.searchFields(this.params_fields);
					data = combineData(geo_result, fields_result);
					this.setZipCode();
				} else {
					data = geo_result.data.slice(0, geo_result.data.length);
				}
			}
		} else {
			let fields_result = await documenu.Restaurants.searchFields(this.params_fields);
			if (this.has_city_or_zip) {
				let avg_lat = 0;
				let avg_lon = 0;
				for (let i in fields_result.data) {
					avg_lat += fields_result.data[i].geo.lat;
					avg_lon += fields_result.data[i].geo.lon;
				}
				if (fields_result.data.length > 0) {
					avg_lat /= fields_result.data.length;
					avg_lon /= fields_result.data.length;
					this.setCoordinates(avg_lat, avg_lon);
					let geo_result = await documenu.Restaurants.searchGeo(this.params_geo);
					data = combineData(fields_result, geo_result);
					this.setCoordinates();
				} else {
					data = fields_result.data.slice(0, fields_result.data.length);
				}
			} else {
				data = fields_result.data.slice(0, fields_result.data.length);
			}
		}
		return data;
	}
	
	// Sets coordinates of area to search, resets when given no arguments
	setCoordinates(lat = undefined, lon = undefined) {
		if (lat === undefined || lon === undefined) {
			delete this.params_geo.lat;
			delete this.params_geo.lon;
			this.has_coord = false;
		} else {
			this.params_geo.lat = lat;
			this.params_geo.lon = lon;
			this.has_coord = true;
		}
	}
	
	// Sets radius of search around coordinates (in miles), resets to 5 when given no arguments
	setDistance(miles = 5) {
		this.params_geo.distance = miles;
	}
	
	// Sets cuisine of restaurants to search, resets when given no arguments
	setCuisine(cuisine) {
		if (cuisine === undefined) {
			delete this.params_fields.restaurant_name;
			delete this.params_geo.cuisine;
		} else {
			this.params_fields.restaurant_name = cuisine;
			this.params_geo.cuisine = cuisine;
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
	
}

module.exports = RestaurantSearch;
