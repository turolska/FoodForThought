const axios = require('axios');
const api_key = 'FnvISgexajVrZlaZlIPvUZFFqNCe8aknAvu6SI4F'

const nps = axios.create({
	baseURL : 'https://developer.nps.gov/api/v1',
	timeout : 2500,
	params : {
		limit : 25,
		api_key : api_key
	}
});

async function makeReq(method = null, params = {}) {
	let result = null;
	if (method != null) {
		try {
			result = (await nps.get(method, {
				params : params
			})).data;
		} catch (error) {
			console.error(error);
		}
	}
	return result;
}

function stringArraySearch(str, array) {
	let result = null;
	for (let i in array) {
		if (array[i].search(new RegExp(str, 'i')) >= 0) {
			result = array[i];
			break;
		}
	}
	return result;
}

/*
function combineData(data1, data2) {
	let inBoth = [];
	let inOne = [];
	let inBothCodes = new Set();
	for (let i in data1) {
		for (let j in data2) {
			if (data1[i].parkCode == data2[j].parkCode) {
				inBoth.push(data1[i]);
				inBothCodes.add(data1[i].parkCode);
				break;
			} else {
				inOne.push(data1[i]);
			}
		}
	}
	for (let i in data2) {
		if (!inBothCodes.has(data2[i].parkCode)) {
			inOne.push(data2[i]);
		}
	}
	let result = inBoth.concat(inOne)
	console.log(data1.length + '+' + data2.length + '=' + result.length);
	return result;
}
*/

function combineData(data1, data2) {
	let codes = new Set();
	let data = data1.slice(0, data1.length);
	for (let i in data1) {
		codes.add(data1[i].parkCode);
	}
	for (let i in data2) {
		if (!codes.has(data2[i].parkCode)) {
			data.push(data2[i]);
		}
	}
	//console.log(data1.length + '+' + data2.length + '=' + data.length);
	return data;
}

class ParkSearch {
	
	constructor() {
		this.dict_activity_IDs = {};
		this.dict_topic_IDs = {};
		this.states = [];
		this.activities = {};
		this.topics = {};
		this.terms = [];
	}
	
	async init() {
		let activities = (await makeReq('/activities')).data;
		for (let i in activities) {
			this.dict_activity_IDs[activities[i]['name']] = activities[i]['id'];
		}
		let topics = (await makeReq('/topics')).data;
		for (let i in topics) {
			this.dict_topic_IDs[topics[i]['name']] = topics[i]['id'];
		}
	}
	
	async search() {
		let data = [];
		let incompleteData = [];
		let activityIDs = Object.values(this.activities);
		let topicIDs = Object.values(this.topics);
		for (let i in activityIDs) {
			let activityData = (await makeReq('/activities/parks', {id : activityIDs[i]})).data[0].parks;
			//incompleteData = combineData(incompleteData, activityData);
			incompleteData = combineData(activityData, incompleteData);
		}
		for (let i in topicIDs) {
			let topicData = (await makeReq('/topics/parks', {id : topicIDs[i]})).data[0].parks;
			incompleteData = combineData(incompleteData, topicData);
		}
		for (let i in incompleteData) {
			let completeData = (await makeReq('/parks', {parkCode : incompleteData[i].parkCode})).data;
			data = combineData(data, completeData);
		}
		//console.log('after activities and topics: ' + data.length);
		if (this.states.length > 0) {
			if (this.terms.length > 0) {
				for (let i in this.states) {
					let params = {stateCode : this.states[i]}
					for (let j in this.terms) {
						params.q = this.terms[j];
						data = combineData(data, (await makeReq('/parks', params)).data);
					}
				}
			} else {
				for (let i in this.states) {
					data = combineData(data, (await makeReq('/parks', {stateCode : this.states[i]})).data);
				}
			}
		} else {
			if (this.terms.length > 0) {
				for (let i in this.terms) {
					data = combineData(data, (await makeReq('/parks', {q : this.terms[i]})).data);
				}
			} else {
				data = combineData(data, (await makeReq('/parks')).data);
			}
		}
		return data;
	}
	
	addState(state_code) {
		if (!this.states.includes(state_code)) {
			this.states.push(state_code);
		}
	}
	
	addTerm(term) {
		let name = stringArraySearch(term, Object.keys(this.dict_activity_IDs));
		if (name != null) {
			this.activities[term] = this.dict_activity_IDs[name];
		} else {
			name = stringArraySearch(term, Object.keys(this.dict_topic_IDs));
			if (name != null) {
				this.topics[term] = this.dict_topic_IDs[name];
			} else {
				this.terms.push(term);
			}
		}
	}
	
	removeState(state_code) {
		this.states = this.states.filter(e => e !== state_code);
	}
	
	removeTerm(term) {
		delete this.activities[term];
		delete this.topics[term];
		this.terms = this.terms.filter(e => e !== term);
	}
	
	clearAll() {
		this.states = [];
		this.activities = {};
		this.topics = {};
		this.terms = [];
	}
}

module.exports = ParkSearch;
