//http://idangero.us/swiper/api/#.V-MUaZMrLOY

// ==========================================================================
// WALLBARD
// ==========================================================================

var wallboard = null;

app.register.controller('wallboardController', function($rootScope, $scope, $timeout, $http, $interval) {
	
	wallboard = $scope;
	
	$scope.settings = {
		speed: 7000,
		reload: 24,
		show: {
			zeros: false
		}
	};
	$scope.queues = [];
	$scope.fetching = false;
	$scope.fetch = {};
	$scope.states = {};
	$scope.slider = {
		show: 'statistics',
		instance: null
	};
	
	$scope.shim = function() {
		
		//return $scope.slider.show = 'agents';
		
		var instance = $scope.slider.instance;
		var speed = $scope.settings.speed ? parseInt($scope.settings.speed) : 7000;
		
		$scope.slider.show = 'statistics';
		
		if (!instance.autoplaying) return;

		$timeout(function() {
			
			if (!instance.autoplaying) return $scope.slider.show = 'statistics';
			
			$scope.slider.show = 'agents';
			
			if (instance.isBeginning && instance.isEnd) $timeout(function() {
			
				$scope.shim();
			
			}, speed / 2);

		}, speed / 2);
		
	};
	
	$scope.$watch('slider.instance', function(instance) {
		
		if (!instance) return;
		
		$scope.shim();
		
		instance.on('transitionStart', $scope.shim);
		
	});

	$rootScope.$watch("session.applets['YXBwbGV0OndhbGxib2FyZA==']", function(n) {
		
		if (n) $scope.settings = $scope.settings;
		
	});
	
	// AUTO RELOAD
	var reload = null; $scope.$watch('settings.reload', function(n) {
		
		var n = n || '24'; n = parseInt(n);
		
		if (reload) $interval.cancel(reload);
		
		reload = $interval(function() {
			
			$rootScope.clearCache();
			
		}, (60000 * 60) * n);

	});
	
	// RELOAD EVERY HOUR
	$interval(function() {
			
		fetch.queues();
			
	}, 60000 * 60);
	
	// AUTO FETCH EVERY 5 MINUTES
	$interval(function() {
			
		_.each($scope.queues, function(callCenter) {
			
			$scope.fetch.states(callCenter);
			
		});
			
	}, 60000 * 5);

// ==========================================================================
// WALLBARD - NEWS
// ==========================================================================

	$scope.news = localStorage['wallboard_news'] ? JSON.parse(localStorage['wallboard_news']) : {};
	
    $(window).on('beforeunload', function() {
	    localStorage['wallboard_news'] = JSON.stringify($scope.news);
    }); 
	
	// QUEUE STATUS
	$(window).on('monitoringStatus', function(e, data) {
		
		var queue = _.find($scope.queues, {serviceUserID: data.targetId}); if (!queue) return;
		
		var zeros = false; try {
			if ($scope.settings.show.zeros) zeros = true;
		} catch(err) {};
		
		// CREATE EVENT BIN FOR QUEUE
		if (!$scope.news[data.targetId]) $scope.news[data.targetId] = {};
		
		$scope.news[data.targetId].timestamp = $.now();

		// IF FIRST EVENT FOR QUEUE
		if (!$scope.news[data.targetId][e.type] || zeros) $scope.news[data.targetId][e.type] = data[e.type];
		
		// AVOID ZEROS
		if (!zeros) for (key in data[e.type]) {
			
			var check = ['averageHandlingTime', 'expectedWaitTime', 'averageSpeedOfAnswer', 'longestWaitTime'];
			var value = data[e.type][key].value || data[e.type][key];
			
			if ((value == 0 || value == '0') && check.indexOf(key) > -1) continue;
			
			$scope.news[data.targetId][e.type][key] = data[e.type][key];

		}

		$scope.$apply();

	});
	
	// ENTER QUEUE
	$(window).on('queueEntry', function(e, data) {
		
		if (!$scope.news[data.targetId]) $scope.news[data.targetId] = {};
		
		if (!$scope.news[data.targetId].statistics) $scope.news[data.targetId].statistics = {};
		
		var current = $scope.news[data.targetId].statistics[data['@attributes']['type']] || 0;

		$scope.news[data.targetId].statistics[data['@attributes']['type']] = current + 1;

		$scope.$apply();
		
	});
	
	// AGENT STATE
	$(window).on('agentStateInfo', function(e, data) {
		
		if (!$scope.states[data.targetId]) $scope.states[data.targetId] = {};
		
		$scope.states[data.targetId].agentACDState = data.agentStateInfo.state;
		$scope.states[data.targetId].agentUnavailableCode = data.agentStateInfo.unavailableCode;

		$scope.$apply();
		
	});
	
// ==========================================================================
// WALLBARD - TOGGLE
// ==========================================================================

	$scope.play = function() {
		
		var instance = $scope.slider.instance;if (!instance) return;
		
		instance.unlockSwipes();
		
		instance.startAutoplay();
		
		$scope.shim();
		
	};

	$scope.pause = function(options) {
		
		var options = options || {};		
		var instance = $scope.slider.instance;if (!instance) return;
		
		if (options.lock) instance.lockSwipes();
		
		instance.stopAutoplay();
		
		$scope.shim();
		
	};
	
// ==========================================================================
// WALLBARD - FETCH - STATES
// ==========================================================================

	$scope.fetch.states = function(queue) {
		
		var queue = queue || null; if (!queue) return;
		var userDetails = []; try {
			userDetails = queue.agentList.userDetails;
		} catch(err) {};
		
		_.each(userDetails, function(user) {
			
			var current = $scope.states[user.userId] || {};
						
			current.fetching = true;
			
			$scope.states[user.userId] = current;
			
			broadsoft.request({
				url: '/user/' + user.userId + '/services/callcenter',
				method: 'GET'
			}, function(r) {
				
				if (r.data.CallCenter) r.data.CallCenter.timestamp = $.now();
				
				$scope.states[user.userId] = r.data.CallCenter;
				
				user.CallCenter = r.data.CallCenter;
			
			});
			
		});

	};
	
// ==========================================================================
// WALLBARD - FETCH - QUEUES
// ==========================================================================

	$scope.fetch.queues = function() {
		
		$scope.queues = [];
		
		$scope.fetching = true;

		broadsoft.request({
			url: '/user/<userid>/directories/agents',
			method: 'GET'
		}, function(r) {
		
			$scope.fetching = false;
			
			var callCenters = []; try {
				callCenters = r.data.CallCenterAgents.callCenter; if ($.type(callCenters) == 'object') callCenters = [callCenters];
			} catch(err) {};
			
			$scope.fetched = true;
			
			_.each(callCenters, function(callCenter) {
				
				callCenter.timestamp = $.now();
				
				if (!callCenter.agentList) callCenter.agentList = {userDetails: []};
				
				if ($.type(callCenter.agentList.userDetails) == 'object') {
					callCenter.agentList.userDetails = [callCenter.agentList.userDetails];
				}
				
				callCenter.key = btoa(callCenter.serviceUserID);
				
				$scope.fetch.states(callCenter);
				
				var match = _.findIndex($scope.queues, {serviceUserID: callCenter.serviceUserID});
				
				if (match > -1) {
					$scope.queues[match] = callCenter;
				} else {
					$scope.queues.push(callCenter);
				}
				
				// PROFILE
				broadsoft.request({
					url: '/callcenter/' + callCenter.serviceUserID + '/profile',
					method: 'GET'
				}, function(r) {
					
					callCenter.ACDProfile = r.data.ACDProfile;

				});
				
				// STATISTICS
				$scope.poll(callCenter.serviceUserID);
				
				// POLICIES - FORWARDING
				broadsoft.request({
					url: '/callcenter/' + callCenter.serviceUserID + '/profile/policies/forceforwarding',
					method: 'GET'
				}, function(r) {
					
					callCenter.ACDForcedForwarding = r.data.ACDForcedForwarding;

				});
				
				// POLICIES - NIGHT
				broadsoft.request({
					url: '/callcenter/' + callCenter.serviceUserID + '/profile/policies/nightservice',
					method: 'GET'
				}, function(r) {
					
					callCenter.ACDNightService = r.data.ACDNightService;

				});
				
				// DNIS
				broadsoft.request({
					url: '/callcenter/' + callCenter.serviceUserID + '/profile/dnis',
					method: 'GET'
				}, function(r) {
					
					callCenter.ACDDNIS = r.data.ACDDNIS;

				});
				
				// CODES
				broadsoft.request({
					url: '/callcenter/' + callCenter.serviceUserID + '/profile/dispositioncodes',
					method: 'GET'
				}, function(r) {
					
					callCenter.ACDCallDispostionCodes = r.data.ACDCallDispostionCodes;

				});
				
				$scope.$broadcast('scroll.refreshComplete');
				
			});
			
		});

	};
	
	$scope.fetch.queues();
	
// ==========================================================================
// WALLBARD - OFFSET
// ==========================================================================	
	
	$scope.offset = function(timeZone) {
		
		var timeZone = timeZone || null;
		var invalid = ['local'];
		var out = {
			timeZone: timeZone
		};
		
		if (!timeZone || invalid.indexOf(timeZone) > -1) return;

		try {
			var s = (new Date()).toLocaleString([], {
			    timeZone: timeZone,
			    year: 'numeric',
			    month: 'numeric',
			    day: 'numeric',
			    hour: 'numeric',
			    minute: 'numeric',
			    second: 'numeric'
			}); out.startTime = new Date(s).getTime();
		} catch(err) {
			
			var m = moment().tz(timeZone);
			
			out.startTime = Date.parse(m.format('LLL'));
				
		};

		return out;

	};
	
// ==========================================================================
// WALLBARD - POLL
// ==========================================================================

	$scope.poll = function(targetId) {
		
		var targetId = targetId || null; if (!targetId) return;
		var url = 'https://www.redial.io/dialer-api/callCenter';
		var after = function(r) {
			
			var statistics = {}; try {
				statistics = r.data.data.statistics;
			} catch(err) {};
			
			if (!$scope.news[targetId]) $scope.news[targetId] = {};
			if (!$scope.news[targetId].monitoringStatus) $scope.news[targetId].monitoringStatus = {};
			if (!$scope.news[targetId].statistics) $scope.news[targetId].statistics = {};
			
			$scope.news[targetId].timestamp = $.now();
						
			if (statistics.queueStatistics) {
				
				var qS = statistics.queueStatistics;
				
				$scope.news[targetId].statistics['ACDCallAbandonedEvent'] = parseInt(qS.numberOfCallsAbandoned || '0');
				$scope.news[targetId].statistics['ACDCallAnsweredByAgentEvent'] = parseInt(qS.numberOfCallsAnswered || '0');
	
				_.extend($scope.news[targetId].statistics, qS);
				
			}

		};
		
		$http.post(url, {
			targetId: targetId,
			include: 'statistics',
			token: $rootScope.access_token()
		}).then(after, after);

	};

// ==========================================================================
// WALLBARD - COLORS
// ==========================================================================

	$scope.colors = ['#6BCCDB','#8BC84B', '#E63E3B', '#F9CA37', '#624EA2', '#B1EA29', '#D8620E', '#ED73C4', '#03A9F4', '#3CBA93', '#453A52', '#7C1E0A', '#25DA61', '#D2727C', '#BE7541'];
	
// ==========================================================================
// WALLBARD - ZIME ZONES
// ==========================================================================
	
	$scope.timezones = [{"value": undefined, "label": "Queue's"},{"value": 'local', "label": "Browser's"},{"value":"Pacific/Midway","label":"(GMT-11:00) Midway Island, Samoa"},{"value":"America/Adak","label":"(GMT-10:00) Hawaii-Aleutian"},{"value":"Etc/GMT+10","label":"(GMT-10:00) Hawaii"},{"value":"Pacific/Marquesas","label":"(GMT-09:30) Marquesas Islands"},{"value":"Pacific/Gambier","label":"(GMT-09:00) Gambier Islands"},{"value":"America/Anchorage","label":"(GMT-09:00) Alaska"},{"value":"America/Ensenada","label":"(GMT-08:00) Tijuana, Baja California"},{"value":"Etc/GMT+8","label":"(GMT-08:00) Pitcairn Islands"},{"value":"America/Los_Angeles","label":"(GMT-08:00) Pacific Time (US & Canada)"},{"value":"America/Denver","label":"(GMT-07:00) Mountain Time (US & Canada)"},{"value":"America/Chihuahua","label":"(GMT-07:00) Chihuahua, La Paz, Mazatlan"},{"value":"America/Dawson_Creek","label":"(GMT-07:00) Arizona"},{"value":"America/Belize","label":"(GMT-06:00) Saskatchewan, Central America"},{"value":"America/Cancun","label":"(GMT-06:00) Guadalajara, Mexico City, Monterrey"},{"value":"Chile/EasterIsland","label":"(GMT-06:00) Easter Island"},{"value":"America/Chicago","label":"(GMT-06:00) Central Time (US & Canada)"},{"value":"America/New_York","label":"(GMT-05:00) Eastern Time (US & Canada)"},{"value":"America/Havana","label":"(GMT-05:00) Cuba"},{"value":"America/Bogota","label":"(GMT-05:00) Bogota, Lima, Quito, Rio Branco"},{"value":"America/Caracas","label":"(GMT-04:30) Caracas"},{"value":"America/Santiago","label":"(GMT-04:00) Santiago"},{"value":"America/La_Paz","label":"(GMT-04:00) La Paz"},{"value":"Atlantic/Stanley","label":"(GMT-04:00) Faukland Islands"},{"value":"America/Campo_Grande","label":"(GMT-04:00) Brazil"},{"value":"America/Goose_Bay","label":"(GMT-04:00) Atlantic Time (Goose Bay)"},{"value":"America/Glace_Bay","label":"(GMT-04:00) Atlantic Time (Canada)"},{"value":"America/St_Johns","label":"(GMT-03:30) Newfoundland"},{"value":"America/Araguaina","label":"(GMT-03:00) UTC-3"},{"value":"America/Montevideo","label":"(GMT-03:00) Montevideo"},{"value":"America/Miquelon","label":"(GMT-03:00) Miquelon, St. Pierre"},{"value":"America/Godthab","label":"(GMT-03:00) Greenland"},{"value":"America/Argentina/Buenos_Aires","label":"(GMT-03:00) Buenos Aires"},{"value":"America/Sao_Paulo","label":"(GMT-03:00) Brasilia"},{"value":"America/Noronha","label":"(GMT-02:00) Mid-Atlantic"},{"value":"Atlantic/Cape_Verde","label":"(GMT-01:00) Cape Verde Is."},{"value":"Atlantic/Azores","label":"(GMT-01:00) Azores"},{"value":"Europe/Belfast","label":"(GMT) Greenwich Mean Time : Belfast"},{"value":"Europe/Dublin","label":"(GMT) Greenwich Mean Time : Dublin"},{"value":"Europe/Lisbon","label":"(GMT) Greenwich Mean Time : Lisbon"},{"value":"Europe/London","label":"(GMT) Greenwich Mean Time : London"},{"value":"Africa/Abidjan","label":"(GMT) Monrovia, Reykjavik"},{"value":"Europe/Amsterdam","label":"(GMT+01:00) Amsterdam, Berlin, Bern, Rome, Stockholm, Vienna"},{"value":"Europe/Belgrade","label":"(GMT+01:00) Belgrade, Bratislava, Budapest, Ljubljana, Prague"},{"value":"Europe/Brussels","label":"(GMT+01:00) Brussels, Copenhagen, Madrid, Paris"},{"value":"Africa/Algiers","label":"(GMT+01:00) West Central Africa"},{"value":"Africa/Windhoek","label":"(GMT+01:00) Windhoek"},{"value":"Asia/Beirut","label":"(GMT+02:00) Beirut"},{"value":"Africa/Cairo","label":"(GMT+02:00) Cairo"},{"value":"Asia/Gaza","label":"(GMT+02:00) Gaza"},{"value":"Africa/Blantyre","label":"(GMT+02:00) Harare, Pretoria"},{"value":"Asia/Jerusalem","label":"(GMT+02:00) Jerusalem"},{"value":"Europe/Minsk","label":"(GMT+02:00) Minsk"},{"value":"Asia/Damascus","label":"(GMT+02:00) Syria"},{"value":"Europe/Moscow","label":"(GMT+03:00) Moscow, St. Petersburg, Volgograd"},{"value":"Africa/Addis_Ababa","label":"(GMT+03:00) Nairobi"},{"value":"Asia/Tehran","label":"(GMT+03:30) Tehran"},{"value":"Asia/Dubai","label":"(GMT+04:00) Abu Dhabi, Muscat"},{"value":"Asia/Yerevan","label":"(GMT+04:00) Yerevan"},{"value":"Asia/Kabul","label":"(GMT+04:30) Kabul"},{"value":"Asia/Yekaterinburg","label":"(GMT+05:00) Ekaterinburg"},{"value":"Asia/Tashkent","label":"(GMT+05:00) Tashkent"},{"value":"Asia/Kolkata","label":"(GMT+05:30) Chennai, Kolkata, Mumbai, New Delhi"},{"value":"Asia/Katmandu","label":"(GMT+05:45) Kathmandu"},{"value":"Asia/Dhaka","label":"(GMT+06:00) Astana, Dhaka"},{"value":"Asia/Novosibirsk","label":"(GMT+06:00) Novosibirsk"},{"value":"Asia/Rangoon","label":"(GMT+06:30) Yangon (Rangoon)"},{"value":"Asia/Bangkok","label":"(GMT+07:00) Bangkok, Hanoi, Jakarta"},{"value":"Asia/Krasnoyarsk","label":"(GMT+07:00) Krasnoyarsk"},{"value":"Asia/Hong_Kong","label":"(GMT+08:00) Beijing, Chongqing, Hong Kong, Urumqi"},{"value":"Asia/Irkutsk","label":"(GMT+08:00) Irkutsk, Ulaan Bataar"},{"value":"Australia/Perth","label":"(GMT+08:00) Perth"},{"value":"Australia/Eucla","label":"(GMT+08:45) Eucla"},{"value":"Asia/Tokyo","label":"(GMT+09:00) Osaka, Sapporo, Tokyo"},{"value":"Asia/Seoul","label":"(GMT+09:00) Seoul"},{"value":"Asia/Yakutsk","label":"(GMT+09:00) Yakutsk"},{"value":"Australia/Adelaide","label":"(GMT+09:30) Adelaide"},{"value":"Australia/Darwin","label":"(GMT+09:30) Darwin"},{"value":"Australia/Brisbane","label":"(GMT+10:00) Brisbane"},{"value":"Australia/Hobart","label":"(GMT+10:00) Hobart"},{"value":"Asia/Vladivostok","label":"(GMT+10:00) Vladivostok"},{"value":"Australia/Lord_Howe","label":"(GMT+10:30) Lord Howe Island"},{"value":"Etc/GMT-11","label":"(GMT+11:00) Solomon Is., New Caledonia"},{"value":"Asia/Magadan","label":"(GMT+11:00) Magadan"},{"value":"Pacific/Norfolk","label":"(GMT+11:30) Norfolk Island"},{"value":"Asia/Anadyr","label":"(GMT+12:00) Anadyr, Kamchatka"},{"value":"Pacific/Auckland","label":"(GMT+12:00) Auckland, Wellington"},{"value":"Etc/GMT-12","label":"(GMT+12:00) Fiji, Kamchatka, Marshall Is."},{"value":"Pacific/Chatham","label":"(GMT+12:45) Chatham Islands"},{"value":"Pacific/Tongatapu","label":"(GMT+13:00) Nuku'alofa"},{"value":"Pacific/Kiritimati","label":"(GMT+14:00) Kiritimati"}];

});