// ==========================================================================
// HOOKS
// ==========================================================================

app.register.controller('hooksController', function($rootScope, $scope, $compile, $timeout) {
	
	var defaults = ['%20'];
	
	$scope.decked = null;
	$scope.current = {
		callId: null,
		call: null
	};	
	$scope.ready = false;
	$scope.loaded = function() {
		
		$scope.ready = true;	
		
	};

	$scope.dummies = [{
		title: 'Google It',
		value: ['https://www.google.com/search?', 'q=', 'call.firstName', '%20', 'call.lastName'],
		method: 'GET',
		target: '_link',
		callState: 'Alerting'
	}, {
		title: 'Find on LinkedIn',
		value: ['https://www.linkedin.com/vsearch/f?', 'keywords=', 'call.remoteParty.name'],
		method: 'GET',
		target: '_link',
		callState: 'Alerting'
	}, {
		title: 'Facebook Search',
		value: ['https://www.facebook.com/search/results?', 'q=', 'call.remoteParty.name'],
		method: 'GET',
		target: '_link',
		callState: 'Alerting'
	}, {
		title: 'White Pages',
		value: ['http://www.whitepages.com/phone/', 'call.cleanAddress'],
		method: 'GET',
		target: '_link',
		callState: 'Alerting'
	}, {
		title: 'Yellow Pages',
		value: ['http://www.yellowpages.com/search?', 'search_terms=', 'call.cleanAddress'],
		method: 'GET',
		target: '_link',
		callState: 'Alerting'
	}];
	
	$scope.default = {
		'1481580361814': $scope.dummies[0]
	};

	$scope.examples = {
		"Alerting": {
			"call": {
				"dummy": true,
				"callId": "callhalf-24844241345:0",
				"extTrackingId": "86000360:2",
				"networkCallId": "979898036_129690496@207.223.67.145",
				"personality": "Terminator",
				"state": "Alerting",
				"remoteParty": {
					"name": "JOHN ADAMS DOE",
					"address": "tel:+18182078000",
					"callType": "Network"
				},
				"endpoint": {
					"@attributes": {
						"type": "AccessEndpoint"
					},
					"addressOfRecord": "8188396400@bluip.com"
				},
				"appearance": "1",
				"allowAnswer": {},
				"startTime": "1475794375670",
				"name": "JOHN ADAMS DOE",
				"firstName": "JOHN",
				"middleName": "ADAMS",
				"lastName": "DOE",
				"formatedAddress": "+1 818-207-8000",
				"cleanAddress": "8182078000"
			}
		},
		"Active": {
			"call": {
				"dummy": true,
				"callId": "callhalf-24844241345:0",
				"extTrackingId": "86000360:2",
				"networkCallId": "979898036_129690496@207.223.67.145",
				"personality": "Terminator",
				"state": "Active",
				"remoteParty": {
					"name": "JOHN ADAMS DOE",
					"address": "tel:+18182078000",
					"callType": "Network"
				},
				"endpoint": {
					"@attributes": {
						"type": "AccessEndpoint"
					},
					"addressOfRecord": "8188396400@bluip.com"
				},
				"appearance": "1",
				"startTime": "1475794375670",
				"answerTime": "1475794382518",
				"name": "JOHN ADAMS DOE",
				"firstName": "JOHN",
				"middleName": "ADAMS",
				"lastName": "DOE",
				"formatedAddress": "+1 818-207-8000",
				"cleanAddress": "8182078000"
			}
		},
		"Released": {
			"call": {
				"dummy": true,
				"callId": "callhalf-24844241345:0",
				"extTrackingId": "86000360:2",
				"networkCallId": "979898036_129690496@207.223.67.145",
				"personality": "Terminator",
				"state": "Released",
				"releasingParty": "remoteRelease",
				"remoteParty": {
					"name": "JOHN ADAMS DOE",
					"address": "tel:+18182078000",
					"callType": "Network"
				},
				"endpoint": {
					"@attributes": {
						"type": "AccessEndpoint"
					},
					"addressOfRecord": "8188396400@bluip.com"
				},
				"startTime": "1475794375670",
				"answerTime": "1475794382518",
				"releaseTime": "1475794388205",
				"name": "JOHN ADAMS DOE",
				"firstName": "JOHN",
				"middleName": "ADAMS",
				"lastName": "DOE",
				"formatedAddress": "+1 818-207-8000",
				"cleanAddress": "8182078000"
			}
		}
	};
	
	$scope.example = angular.copy($scope.examples);
	
	$(window).on('Call', function(e, data) {
		
		if (!data || !data.call || !data.call.callId) return;
		
		if (data['@attributes']['type'] == 'CallReceivedEvent') return;
		
		var fresh = true; try {
			
			if ($scope.current.callId == data.call.callId) fresh = false;
			
		} catch(err) {};
		
		$scope.current.callId = data.call.callId;
		
		// CLEAR ON NEW CALL ID
		if (fresh) $scope.example = angular.copy($scope.examples);
		
		$scope.current.call = data;
		
		$scope.example[data.call.state] = {
			call: data.call
		};
				
		$scope.$apply();
		
		$timeout(function() {
			
			$scope.check(data.call);
			
		});
		
	});
	
	$scope.makeTokens = function(state) {
		
		var state = state || 'Alerting';
		var data = $scope.example[state] || $scope.example['Alerting'];
		
		return _.flatten([defaults, objectToPaths(data)]);
		
	};
	
	$scope.check = function(call) {
		
		var call = call || {}; if (!call || !call.state) return;
		var hooks = []; try {
			hooks = _.toArray($rootScope.session.applets['YXBwbGV0Omhvb2tz'].hooks);
		} catch(err) {};
		
		var matches = _.where(hooks, {
			callState: call.state,
		}); if (!matches.length) return;
		
		_.each(matches, function(match) {
			
			var url = $scope.sample(match.value, match.callState);
			
			if (url && match.target == '_pop') $rootScope.popup.open({
				url: url
			});
			
			if (url && match.target == '_tab') window.open(url, url);

		});
	
	};
	
// ==========================================================================
// HOOKS - SAMPLE
// ==========================================================================
	
	$scope.sample = function(parts, state) {                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          
				
		var parts = parts || [];
		var parts = angular.copy(parts);
		var state = state || 'Alerting';
		
		for (i = 0; i < parts.length; i++) {
			try {
				
				var string = parts[i];
				
				if (string.indexOf('call') == 0) string = '$scope.example.' + state + '.' + string;
				
				var value = eval(string);
				
				if (value) parts[i] = value;
				
			} catch(err) {};
		}
		
		return decodeURIComponent(parts.join(''));

	};
	
// ==========================================================================
// HOOKS - EDIT
// ==========================================================================
	
	$scope.edit = function(hook) {    
		
		var hook = hook || null; if (!hook) return;
		
		hook.edit ? hook.edit = false : hook.edit = true;

	};

});