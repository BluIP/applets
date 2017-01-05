// ==========================================================================
// APP - AUTO DIALER
// ==========================================================================

app.register.controller('autoCtrl', function($rootScope, $scope, $compile, $timeout, $http) {
	
	//http://laxxsp1.masteraccess.com/com.broadsoft.xsi-actions/test/v2.0/user/userid/calls/
	
	/*
		{
		"callId": "callhalf-259129459:0",
		"extTrackingId": "1210587:2",
		"networkCallId": "BW0045550790401171865306615@199.168.176.135",
		"personality": "Originator",
		"state": "Released",
		"releasingParty": "localRelease",
		"remoteParty": {
			"address": "tel:3233711507",
			"callType": "Network"
		},
		"startTime": "1483490755007",
		"releaseTime": "1483490756453",
		"formatedAddress": "+1 323-371-1507",
		"cleanAddress": "3233711507"
		}
	*/	
	
	$scope.current = {
		active: false
	};
	
	$scope.current.list = [
/*
		{
			Name: 'Andy\'s Cell',
			Number: '3233711507'
		},
		{
			Name: 'Andy\'s Voicemail',
			Number: '6414'
		}
*/
	];
	
// ==========================================================================
// APP - ON NEW CALL
// ==========================================================================
	
	$(window).on('Call', function(e, data) {
		
		if (!data || !data.call || !data.call.callId) return;
		
		var match = _.find($scope.current.list, {callId: data.call.callId});
		
		if (match) match.call = data.call;
		
		if (data.call.state == 'Released' && match) match.active = false;
		
		
		if (data.call.state == 'Released') $timeout(function() {
			
			// IF NO ACTIVE CALL, CALL NEXT
			if (!_.find($scope.current.list, {active: true})) $scope.tick();
			
		}, $scope.current.gap.selected);
		
	});
	
// ==========================================================================
// APP - STOP
// ==========================================================================

	$scope.stop = function() {
		
		$scope.current.active = false;
		
	};
	
// ==========================================================================
// APP - START
// ==========================================================================

	$scope.start = function() {
		
		if (!$scope.current.list.length) return $rootScope.notify({
			memo: 'Load some data!'
		});
		
		var start = function() {
			
			$scope.current.active = true; $scope.$apply();
			
			$scope.tick($scope.current.list[0]);
			
		};
		
		$rootScope.notify({
			type: 'question',
			title: 'Ready?',
			memo: 'Click "OK" to start making calls!',
			showCancelButton: true
		}, function(c) {
			
			if (c == true) start();
			
		});	

	};
	
// ==========================================================================
// APP - TICK
// ==========================================================================

	$scope.tick = function(item) {
		
		if (!$scope.current.active) return;
		
		var item = item || _.find($scope.current.list, function(i) {
			
			return !i.call;
			
		});
		
		if (!item) {
			
			$rootScope.notify({
				type: 'success',
				memo: 'No more items need to be called!'
			});
			
			return $scope.stop();
			
		}
		
		if (item.call) return $scope.stop();
		
		var number = item.Number || item['"Number"'] || item.number;
				
		// MAKE THE CALL
		broadsoft.request({
			method: 'POST',
			url: '/user/{{userId}}/calls/new?address=' + number
		}, function(r) {
			
			try {
				item.call = r.data.CallStartInfo;
			} catch(err) {};
			
			try {
				item.error = r.data.ErrorInfo;
			} catch(err) {};
			
			if (item.call) item.active = true;
			if (item.call) item.callId = item.call.callId;
			
			if (item.error) console.log('Unable to dial... what should we do here?');
						
		});
		
	};
	
	
// ==========================================================================
// APP - RESET CSV
// ==========================================================================

	$scope.reset = function() {
		
		$scope.stop();
		
		for(i = 0; i < $scope.current.list.length; i++) {
			try {
				$scope.current.list[i].call.state = 'Uncalled';
			} catch(err) {};
		}
		
	};
	
	
// ==========================================================================
// APP - CHANGE TIME GAP BETWEEN CALLS
// ==========================================================================

	$scope.current.gap = {
		0 : 0,
		5 : 5000,
		15 : 15000,
		30 : 30000,
		1 : 60000	
	};
	
	$scope.current.selected = $scope.current.gap[1];

	$scope.changeGap = function() {
		
		$rootScope.notify({
			title: 'Call Break',
			memo: 'Amount of time between calls.',
			input: 'select',
			inputOptions: $scope.current.gap,
			inputPlaceholder: $scope.current.selected,
			showCancelButton: true
		}).then(function(r) {
			$scope.current.selected = r;
			
			console.log(r);
		})
	};


// ==========================================================================
// APP - DROPPED
// ==========================================================================

	$scope.dropped = function(files) {
		
		var files = files || null; if (!files) return;
		
		$rootScope.files.read(files, function(files) {
			
			var file = _.toArray(files)[0];
			
			if (!file || !file.parsed) return $rootScope.notify({
				memo: 'Unable to parse file!'
			});
			
			var sheet = _.toArray(file.parsed)[0];
			
			$scope.current.list = sheet;
			
		});
	};
});