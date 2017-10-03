// ==========================================================================
// APPLET
// ==========================================================================

api.controller('appletController', function($rootScope, $scope, $compile, $timeout) {
	
	$scope.current = {
		fetching: false
	};
	
// ==========================================================================
// APPLET - myFunction
// ==========================================================================

	$scope.myFunction = function() {
		
		$scope.current.fetching = true;
		
		$timeout(function() {
			
			$scope.current.fetching = false;
			
		}, 420);

	};

});