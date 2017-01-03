// ==========================================================================
// APP - AUTO DIALER
// ==========================================================================

app.register.controller('autoCtrl', function($rootScope, $scope, $compile, $timeout, $http) {
	
	$scope.current = {
		fetching: false,
		fetched: false,
		calling: false,
		info: {
			callname: null,
			phone: null
		},
		csvurl: null,
		list: [
			{
				Name: 'Andy\'s Voicemail',
				Number: '6414'
			},
			{
				Name: 'Andy\'s Cell',
				Number: '3233711507'
			}
		],
		call: 'Nothing Yet'
	};
	
	$(window).on('Call', function(e, data) {
		
		if (!data || !data.call || !data.call.callId) return;
		
		$scope.current.call = data.call.state;
		$scope.$apply();
		
		console.log($scope.current.call);
		
	});
	
// ==========================================================================
// FETCH CSV
// ==========================================================================

/*
	$scope.fetchcsv = function() {
		
		$scope.current.fetching = true;
		
		$timeout(function() {
			
			$scope.current.fetching = false;
			
		}, 2000);

	};
*/
	
// ==========================================================================
// 	BEGIN CALLING
// ==========================================================================

	$scope.beginCalling = function() {
		
		for(var i = 0; i < $scope.current.list.length; i++) {
			
			//console.log($scope.current.list[i]);
			
			$rootScope.dial($scope.current.list[i]['Number']);
			
/*
			while($scope.current.call != 'Released') {
				$timeout(function() {
			
					console.log('On call...')
					
				}, 2000);
			}
*/
			
		}
		
	};
});