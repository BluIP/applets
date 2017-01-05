// ==========================================================================
// AGENT
// ==========================================================================

app.register.controller('agentController', function($rootScope, $scope, $compile, $timeout) {
	
	$scope.current = {};
	
// ==========================================================================
// AGENT - ACD
// ==========================================================================

	$scope.acd = {};
	
// ==========================================================================
// AGENT - ACD - SET
// ==========================================================================
	
	$scope.acd.set = function(what) {
		
		var what = what || null; if (!what) return;
		
		var xml = '<?xml version="1.0" encoding="UTF-8"?>';
			xml += '<CallCenter xmlns="http://schema.broadsoft.com/xsi">';
			xml += '<agentACDState>' + what.agentACDState + '</agentACDState>';
			
			if (what.agentUnavailableCode) {
				xml += '<agentUnavailableCode>' + what.agentUnavailableCode + '</agentUnavailableCode>';
			} else {
				xml += '<agentUnavailableCode xs:nil="true" xmlns:xs="http://www.w3.org/2001/XMLSchema-instance" />';
				$scope.agentUnavailableCode = null;
			}
			
			xml += '</CallCenter>';
		
		$scope.current.fetching = true;
		
		broadsoft.request({
			method: 'PUT',
			url: '/user/{{userId}}/services/callcenter',
			data: xml
		}, function(r) {
			
			if (r.status == 200) $rootScope.notify({
				type: 'success',
				title: 'Success!',
				html: 'Changed agent status to <b>' + (_.compact([
					what.agentACDState,
					what.agentUnavailableCode
				]).join(': ')) + '</b>.'
			});
			
			if (r.data && r.data.ErrorInfo) $rootScope.notify({
				memo: r.data.ErrorInfo.summary + '.'
			});
			
			$scope.current.fetching = false;
			
			$scope.acd.get();
			
		});	
		
	};
	
// ==========================================================================
// AGENT - ACD - GET
// ==========================================================================

	$scope.acd.get = function() {
		
		$scope.current.fetching = true;

		broadsoft.request({
			method: 'GET',
			url: '/user/{{userId}}/services/callcenter'
		}, function(r) {
			
			$scope.$broadcast('scroll.refreshComplete');
			
			$scope.current = r;
			
			try {
				
				if (r.data.CallCenter.agentUnavailableCode) $scope.agentUnavailableCode = r.data.CallCenter.agentUnavailableCode;
				
				if (r.data.CallCenter.agentACDState != 'Unavailable') $scope.agentUnavailableCode = null;
				
			} catch(err) {};
			
			if (r.status == 200) $scope.codes.get();
						
		});

	};
	
	$scope.acd.get();
	
// ==========================================================================
// AGENT - ACD - CODES
// ==========================================================================
	
	$scope.codes = {
		get: function() {
			
			broadsoft.request({
				method: 'GET',
				url: '/group/0000100001/services/callcenter/unavailablecodes?serviceproviderId=00001&enterpriseId=00001'
			}, function(r) {
				
				try {
					if (r.data.ACDAgentUnavailableCodes) $scope.current.data.ACDAgentUnavailableCodes = r.data.ACDAgentUnavailableCodes;
				} catch(err) {};
											
			});
			
		}
	};
	
});