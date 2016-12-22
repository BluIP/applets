// ==========================================================================
// Dummy
// ==========================================================================

app.register.controller('dummyController', function($rootScope, $scope, $compile, $timeout) {
	
	$scope.current = {
		fetching: false
	};
	
// ==========================================================================
// Dummy - myFunction
// ==========================================================================

	$scope.myFunction = function() {
		
		$scope.current.fetching = true;
		
		$timeout(function() {
			
			$scope.current.fetching = false;
			
		}, 420);

	};

});