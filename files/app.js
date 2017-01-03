// ==========================================================================
// Files
// ==========================================================================

app.register.controller('filesController', function($rootScope, $scope, $compile, $timeout) {
	
	$scope.current = {
		editor: null
	};

// ==========================================================================
// Files - View
// ==========================================================================

	$scope.view = function(data) {
		
		var container = document.getElementById('json_viewer');

		if ($scope.current.editor) $scope.current.editor.destroy();
		
		$scope.current.editor = new JSONEditor(container, {});
		
		$scope.current.editor.set(data);
		
	};
	
// ==========================================================================
// Files - Picked
// ==========================================================================
	
	$scope.picked = function(input) {
		
		var input = input || null; if (!input) return;
		
		$scope.dropped(input.files);
		
	};
	
// ==========================================================================
// Files - Dropped
// ==========================================================================
	
	$scope.dropped = function(files) {
		
		var files = files || null; if (!files) return;
		
		$rootScope.files.read(files, function(data) {
			
			_.each(data, function(d, key) {
				
				if (data[key].src) data[key].src = data[key].src.length > 5000 ? (d.src.substring(0, 5000) + '... (TRIMMED)') : d.src;
				
			});
			
			$scope.view(data);
			
		});
		
	};

});