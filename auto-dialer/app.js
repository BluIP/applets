// ==========================================================================
// APP - AUTO DIALER
// ==========================================================================

app.register.controller('autoCtrl', function($rootScope, $scope, $compile, $timeout, $http, $ionicActionSheet) {
	
	$scope.callId = null;
	$scope.current = {
		active: false,
		list: [],
		gaps: {
			0: '0 Seconds',
			5000: '5 Seconds',
			15000: '15 Seconds',
			30000 : '30 Seconds',
			60000 : '60 Seconds'
		},
		gap: 5000
	};
	
// ==========================================================================
// APP - ON NEW CALL
// ==========================================================================

	$(window).on('Call', function(e, data) {
		
		if (!data || !data.call || !data.call.callId) return;
		
		if ($scope.callId != data.call.callId) return;
		
		var callId = data.call.callId;
		var state = data.call.state;
		var match = _.find($scope.current.list, { callId: callId });
		
		// SET CURRENT LIST ITEM'S CALL DATA DETAILS
		if (match) match.call = data.call;
			
		// DEACTIVATE CURRENT ITEM
		if (match && state == 'Released') {
			
			match.active = false;
			
		}

		// MAKE NEXT CALL
		if (state == 'Released') $scope.tick();

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
			type: 'error',
			title: 'No List Loaded',
			memo: 'You can load either a <b>CSV</b> or <b>XLXS</b>',
			showCancelButton: true,
			confirmButtonText: 'Load'
		}, function(c) {
			
			if (c == true) $scope.loadList();
			
		});
		
		$rootScope.notify({
			type: 'question',
			title: 'Ready?',
			memo: 'Start the automated calling process.',
			showCancelButton: true
		}, function(c) {
			
			if (c != true) return;
			
			$scope.current.active = true; $scope.$apply();
			$scope.tick();
			
		});

	};
	
// ==========================================================================
// APP - TICK
// ==========================================================================

	$scope.tick = function(item) {
		
		// IF APPLET IS RUNNING
		if (!$scope.current.active) return;
		
		var active = _.find($scope.current.list, { active: true }); if (active) return;
		
		// USE ITEM GIVEN OR FIND AN ITEM THAT HASN'T BEEN CALLED
		var item = item || _.find($scope.current.list, function(i) {
			
			return !i.call;
			
		});
		
		// IF NO MORE CALLS TO MAKE
		if (!item) {
			
			$scope.stop();
			
			return $rootScope.notify({
				type: 'success',
				title: 'Done!'
			});
			
		}
		
		var number = item.number;
		
		// IF ITEM DOESN'T HAVE A NUMBER
		if (!number || !number.length) {
			
			// GIVE ITEM A FAKE CALL SO THAT IT DOESN'T TRY TO RECALL THE SAME ITEM
			item.call = {
				error: 'Missing a number!'
			};
			
			return $scope.tick();
			
		}
		
		// COUNTDOWN
		$scope.countDown(function() {
			
			// MAKE THE CALL
			broadsoft.request({
				method: 'POST',
				url: '/user/{{userId}}/calls/new?address=' + number
			}, function(r) {
				
				// IF UNABLE TO MAKE THE CALL NO MATTER WHAT!
				if (r.status != 201) {
					
					var error = 'Unable to make a call to this number!'; try {
						if (r.data.ErrorInfo) error = r.data.ErrorInfo.summary + '.';
					} catch(err) {};
					
					item.call = { error: error };
	
					return swal({
						type: 'warning',
						confirmButtonText: 'Skip',
						showCancelButton: true,
						title: 'Invalid Number',
						cancelButtonText: 'Stop',
						html: '<b>'+ item.number + ' is not a valid number.</b><br><br>\'Skip\' to try next number or \'Stop\' to stop.'
					}).then(function(r) {
						if (r == true) $scope.tick();
					}, function() {
						$scope.stop(); $scope.$apply();
					});
					
				}
	
				item.active = true;
				
				// SET A CALL ON THE ITEM SO IT'S NOT RECALLED AGAIN
				item.call = r.data.CallStartInfo;
				
				// MY APPLET SHOULD ONLY CONTROL CALLS THAT MY APPLET MAKES!
				$scope.callId = item.call.callId;
				
				item.callId = item.call.callId;
	
			});

		});
		
	};

// ==========================================================================
// APP - RESET CSV
// ==========================================================================

	$scope.reset = function() {
		
		$scope.stop();
		
		for(i = 0; i < $scope.current.list.length; i++) {
			try {
				delete $scope.current.list[i].call;
			} catch(err) {};
		}
		
	};

// ==========================================================================
// APP - CHANGE TIME GAP BETWEEN CALLS
// ==========================================================================

	$scope.changeGap = function() {
		
		swal({
			title: 'Call Break',
			text: 'Gap of time between calls.<br> Useful for quick notes or catching your breath.',
			input: 'select',
			inputOptions: $scope.current.gaps,
			inputPlaceholder: 'Select Time',
			showCancelButton: true
		}).then(function (r) {
			
			$scope.current.gap = r; $scope.$apply();
			
		});
		
	};

// ==========================================================================
// APP - CLEAR LIST
// ==========================================================================

	$scope.clearList = function() {
		
		$scope.current.list = [];
	
	};
	
// ==========================================================================
// APP - LOAD LIST
// ==========================================================================

	$scope.loadList = function() {
		
		$('#add-file').click();
		
	};
	
// ==========================================================================
// APP - MENU POPOVER
// ==========================================================================

	$scope.actionSheet = function() {
		
		var hideSheet = $ionicActionSheet.show({
			buttons: [
				{ text: 'Reset Calls', fn: $scope.reset },
				{ text: 'Unload List', fn: $scope.clearList },
				{ text: 'Load List', fn: $scope.loadList }
			],
			titleText: 'Actions',
			cancelText: 'Close',
			cancel: function() {},
			buttonClicked: function(index, item) {

				if (item.fn) item.fn();
				
				return true;
			
			}
		});
		
	};
	
// ==========================================================================
// APP - COUNT DOWN
// ==========================================================================

	$scope.countDown = function(callback) {
		
		var callback = callback || function() {};
		var seconds = ($scope.current.gap / 1000) + 1;
		
		$('#t').text($scope.current.gap / 1000 + 's');
			
		(function countDown() {
			if (seconds-- > 0 && $scope.current.active) {
				$('#t').text(seconds + 's');
				setTimeout(countDown, 1000);
			} else {
				if ($scope.current.active) callback();
			}
		})();
		
	};

// ==========================================================================
// APP - DROPPED
// ==========================================================================

	$scope.dropped = function(files) {
		
		var files = files || null; if (!files) return;
		
		$rootScope.files.read(files, function(files) {
			
			var file = _.toArray(files)[0];
			
			if (!file || !file.parsed) return $rootScope.notify({
				title: 'Invalid File Type',
				memo: 'Please load either a <b>CSV</b> or <b>XLSX</b> file.'
			});
			
			var sheet = _.toArray(file.parsed)[0];
			var inputOptions = {}; _.each(Object.keys(sheet[0]), function(v) {
				inputOptions[v] = v;
			});
			
			if (!Object.keys(inputOptions).length) return $rootScope.notify({
				type: 'error',
				memo: 'No column keys found!'
			});
			
			var keys = { name: null, number: null };
			var steps = [
				{
					title: 'Pick \'Name\' Column',
					text: 'This is the name of the person you will be calling.',
					inputOptions: inputOptions,
					input: 'select',
					allowOutsideClick: false,
					allowEscapeKey: false,
					confirmButtonText: 'Next',
					progressSteps: ['1', '2'],
					preConfirm: function () {
						return new Promise(function(resolve, reject) {
							
							keys['name'] = $('.swal2-select').val();
							
							resolve();
							
						});
					}
				},
				{
					animation: false,
					title: 'Pick \'Phone\' Column',
					text: 'This is the number to be dialed.',
					allowOutsideClick: false,
					allowEscapeKey: false,
					inputOptions: inputOptions,
					input: 'select',
					confirmButtonText: 'Done',
					progressSteps: ['1', '2'],
					preConfirm: function () {
						return new Promise(function(resolve, reject) {
							
							keys['number'] = $('.swal2-select').val();
							
							resolve();
							
						});
					}
				}
			]
			
			var list = [];
			
			// WAIT A MOMENT WHILE LIST IS LOADED
			if (files) $timeout(function() {
				
				// SWAL TO ALLOW USER TO SELECT COLUMNS				
				var test = swal.queue(steps).then(function(c) {
					
					$timeout(function() {
					
						for (i = 0; i < sheet.length; i++) {
							
							if (i > 1000) continue;
							
							var number = sheet[i][keys.number];
							
							if (number) list.push({
								name: sheet[i][keys.name],
								number: number
							});
							
						}
						
						$scope.current.list = list; $scope.$apply();
						
						if (sheet.length > 1000) $timeout(function() {
							
							$rootScope.notify({
								type: 'warning',
								title: 'List Clipped',
								memo: '1000 is the max number of entries.'
							});
							
						});
					
					});			

				});
				
			}, 1500);
			
		});
	};
	
});