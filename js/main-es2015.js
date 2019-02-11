var GAME = {};
GAME.players = [];
GAME.roles = [];
GAME.round = 1;
GAME.state = "";
GAME.summary = [];

GAME.verbose = {
	killed_by_red: "kill",
	killed_by_black: "kill",
	healed: "heal",
	sexed: "sleep with",
	inspected: "inspect",
	silenced: "silence"
}

$(function() {

	//grab players from json
	$.ajax({
	  url: "js/players.json",
	  async: true,
	  cache: false,
	  success: function(res) {
	  	// console.log(res);
	  	buildPlayers(res);
	  },
	  dataType: "json"
	});
	
	function buildPlayers(data) {

		for (var i=0; i<data.length; i++) {
			var _player = $('.template .player-setup').clone();
			_player.find('.name').val(data[i].id);
			_player.find('label').html(data[i].name);
			_player.find('.name').data('name',data[i].name);
			$('.setup .players .list').append(_player);
		}

	}

	//setup screen buttons
	$('.setup .players .buttons .all').on('click', function(event) {
		$('.setup .players .player-setup input[type=checkbox]').prop('checked', true);
		$('.setup .players .player-setup input[type=checkbox]').change();
	});

	$('.setup .players .buttons .remove').on('click', function(event) {
		$('.setup .players .player-setup input[type=checkbox]').prop('checked', false);
		$('.setup .players .player-setup input[type=checkbox]').change();
	});

	$('.setup .roles .buttons .all').on('click', function(event) {
		$('.setup .roles .role input[type=checkbox]').prop('checked', true);
		$('.setup .roles .role input[type=checkbox]').change();
	});

	$('.setup .roles .buttons .remove').on('click', function(event) {
		$('.setup .roles .role input[type=checkbox]').prop('checked', false);
		$('.setup .roles .role input[type=checkbox]').change();
	});

	//setup screen data change
	$(document).on('change', '.player-setup input[type=checkbox]', function(event) {
		var _count = $('.player-setup input[type=checkbox]:checked').length;
		$('.setup .players .total span').html(_count);
	});

	//start game and grab settings
	$(document).on('click', '.start', function(event) {

		//add a prompt to make sure everything's gucci
		//create active players
		$('.player-setup input[type=checkbox]:checked').each(function(index) {
			GAME.players.push({
				id: $(this).val(), 
				name: $(this).data('name'),
				alive: true,
				status: [],
				role: "citizen",
				team: "citizens",
				selection: null
			});
		});

		//add roles to GAME object
		$('.role input[type=checkbox]:checked').each(function(index) {
			if ($(this).hasClass('red_killers') || $(this).hasClass('black_killers')) {
				GAME.roles.push({
					type: $(this).val(), 
					ability: $(this).data('ability'),
					order: $(this).data('order'),
					count: parseInt($(this).parent().siblings('.properties').find('input').val())
				});
			} else {
				GAME.roles.push({
					type: $(this).val(), 
					ability: $(this).data('ability'),
					order: $(this).data('order'),
					count: 1
				});
			}
		});

		sortObj(GAME.roles, "order");
		console.log(GAME);
		console.log(GAME.players);
		console.log(GAME.roles);

		$('.setup').hide();

		createBoard();

	});

	// window.onbeforeunload = function() {
	//   return "This game will be lost if you leave the page, are you sure?";
	// };


	function createBoard() {

		$('.board').removeClass('js-hide');

		$.each(GAME.players, function(index, value) {
			var _tile = $('.template .player').clone();
			_tile.find('.name').html(value.name);
			_tile.attr('data-id', value.id);
			_tile.find('.role').html(value.role);
			_tile.find('.alive').html(value.alive);
			if (value.status.length == 0) {
				_tile.find('.status').html("normal");
			} else {
				_tile.find('.status').html(value.status.toString());
			}
			// _tile.find('.team').html(value.team);
			$('.board .players').append(_tile);
		});

	
		$('.instructions').addClass('js-active');
		GAME.round = 1;
		GAME.turn = GAME.roles[0].type;
		GAME.state = "assign";
		actionRound();

	}

	function actionRound() {

		//assign roles to people
		if (GAME.round == 1) {

			if (GAME.turn != "vote") {
				//ASSIGN PLAYERS OR SELECT TARGETS
				if (GAME.state == "assign") {
					showScript("<strong>READ:</strong> Would the "+GAME.turn+" please wake up?");
					showInstruction("<strong>INSTRUCTION:</strong> Identify and select the ["+getSetupRolesCount(GAME.turn)+" "+GAME.turn+"] to assign their roles");
					enablePlayerSelection(GAME.turn);
				} else if (GAME.state == "target") {
					var _ability = getRoleAbility(GAME.turn);
					showScript("<strong>READ:</strong> Would the "+GAME.turn+" please select who they'd like to "+GAME.verbose[_ability]);
					showInstruction("<strong>INSTRUCTION:</strong> Select the <strong>["+GAME.turn+"]</strong> target");
					enablePlayerSelection(GAME.state);
				}
			} else {
				// VOTE
				$('.abstain').addClass('js-active');
				showScript("<strong>READ:</strong> It is time to vote someone out");
				showInstruction("<strong>INSTRUCTION:</strong> Select the voted target");
				enablePlayerSelection("vote");

			}
		} else {
			//ANY ROUND AFTER 1

			if (GAME.turn != "vote") {
				//SELECT TARGETS
				$('.abstain').removeClass('js-active');
				var _ability = getRoleAbility(GAME.turn);
				showScript("<strong>READ:</strong> Would the "+GAME.turn+" please select who they'd like to "+GAME.verbose[_ability]);
				showInstruction("<strong>INSTRUCTION:</strong> Select the <strong>["+GAME.turn+"]</strong> target");
				enablePlayerSelection("target");

			} else {
				//VOTE
				$('.abstain').addClass('js-active');
				showScript("<strong>READ:</strong> It is time to vote someone out");
				showInstruction("<strong>INSTRUCTION:</strong> Select the voted target");
				enablePlayerSelection("vote");

			}

			

		}

	}

	$(document).on('click', '.next', function(event) {

		console.log('=== NEXT CLICKED ===');


		if (GAME.turn != "vote") {

			if (GAME.state == "assign") {
				//first round assigning of roles

				//error state if they don't select the right amount
				if ($('.js-selected').length < getSetupRolesCount(GAME.turn)) {
					alert('Make proper number of selections please');
					return;
				}

				$('.board .players .player.js-selected').each(function(i,k) {
					var _id = $(this).data('id');
					updatePlayerAttribute(_id, "role", GAME.turn);
					if (GAME.turn == "red_killers" || GAME.turn == "black_killers") {
						updatePlayerAttribute(_id, "team", GAME.turn);
					}
					GAME.state = "target";
				});
			} else {
				//this is where statuses get updated depending on shiet
				$('.board .players .player.js-selected').each(function(i,k) {
					var _id = $(this).data('id');
					var _ability = getRoleAbility(GAME.turn);
					updatePlayerAttribute(_id, "status", _ability);
					GAME.summary.push(
						{
							round: GAME.round,
							target: _id,
							action: _ability,
							sentence: getPlayerName(_id) + " was " + _ability						
						}
					);
				});

				//round 1 toggle back and forth between assign
				if (GAME.round == 1) {
					GAME.state = "assign";
				}

				var _nextTurn = GAME.turn;
				GAME.turn = nextRoleTurn(_nextTurn);

				if (GAME.turn == "vote") {

					//inspector logic
					var sexed = getPlayerWithStatus('sexed');
					var inspected = getPlayerWithStatus('inspected');

					if (inspected != undefined) {
						if (sexed != undefined && sexed.role == "inspector") {
							alert('SHRUG');			
						} else {
							if (inspected.role == "red_killers" || inspected.role == "black_killers") {
								alert('THUMBS UP THEY A KILLER');
							} else {
								alert('THEY A CITIZEN');
							}				
						}
					}

					evaluateStatuses();

				}
				

				// if (getSetupRolesCount('inspector') > 0) {
				
				// 	inspectorFunction();
				
				// } else {

				
				// }

				

				
			}

		} else {

			//WAKE UP HAPPENS HERE

			evaluateGame();
			console.log(evaluateGame());

			//VOTING PROCESS
			$('.board .players .player.js-selected').each(function(i,k) {
				var _id = $(this).data('id');
				updatePlayerAttribute(_id, "alive", false);
				updatePlayerAttribute(_id, "status", "voted");
			});

			clearPlayerStatuses();
			var _number = GAME.round;
			_number++;
			GAME.round = _number;
			GAME.turn = GAME.roles[0].type;
			GAME.state = "target";
			console.log(GAME.round);
			console.log(GAME.turn);
			console.log(GAME.state);

			//VOTING PROCESS COMPLETE;
			evaluateGame();
			console.log(evaluateGame());

		}

		$(document).off('click', '.board .players .player');
		updateBoard();

	});


	function updateBoard() {

		$('.board .players').empty();

		$.each(GAME.players, function(index, value) {
			var _tile = $('.template .player').clone();
			_tile.find('.name').html(value.name);
			_tile.attr('data-id', value.id);
			_tile.find('img').attr('src', 'img/'+value.role+'.svg');
			_tile.find('.role').html(value.role);
			if (value.role != "citizen" && GAME.state == "assign" && GAME.turn != "vote") {
				_tile.addClass('js-noselect');
			} else {
				_tile.removeClass('js-noselect');
			}
			_tile.find('.alive').html(String(value.alive));
			if (value.alive == false) {
				_tile.addClass("js-dead");
			}
			if (value.status.length == 0) {
				_tile.find('.status').html("normal");
			} else {
				_tile.find('.status').html(value.status.toString());
				if (value.status.indexOf('silenced') >= 0 && GAME.turn == "vote") {
					_tile.addClass("js-silenced");
				}
			}
			// _tile.find('.team').html(value.team);
			$('.board .players').append(_tile);
		});

		actionRound();

	}

	function evaluateStatuses() {

		var affected = getPlayersWithStatus();

		$.each(affected, function(index, value) {


			if (affected[index].status.indexOf('killed_by_red') >= 0 || affected[index].status.indexOf('killed_by_black') >= 0) {
				updatePlayerAttribute(affected[index].id, "alive", false);
			}
			
			if (affected[index].status.indexOf('healed') >= 0) {
				// updatePlayerAttribute(affected[index].id, "status", "healed");
				updatePlayerAttribute(affected[index].id, "alive", true);
			}

		});

		var sexd = getPlayerWithStatus('sexed');

		if (sexd != undefined) {

			console.log('== SEXED ==');
			console.log(sexd.role);
			switch(sexd.role) {
				case "red_killers":
					var _player = getPlayerWithStatus('killed_by_red');
					console.log('killed_by_red undone');
					updatePlayerAttribute(_player.id, "alive", true);
				break;
				case "black_killers":
					var _player = getPlayerWithStatus('killed_by_black');
					console.log('killed_by_black undone');
					updatePlayerAttribute(_player.id, "alive", true);
				break;
				case "dentist":
					var _player = getPlayerWithStatus('silenced');
					console.log('silenced undone');
					console.log(_player);
					removePlayerStatus(_player.id, "silenced");
				break;
				case "doctor":
					var _player = getPlayerWithStatus('healed');
					console.log(_player);
					console.log('healed undone');
					removePlayerStatus(_player.id, "healed");
					if (_player.status.indexOf('killed_by_red') >= 0 || _player.status.indexOf('killed_by_black') >= 0) {
						updatePlayerAttribute(_player.id, "alive", false);
					}
				break;
				default:
					// console.log('sexing did nothing'); 
				break;
			}

		}

		updateGamelog();
		updateBoard();

	}

	function evaluateGame() {
		//determine who wins...
		console.log("=== EVALUATE WIN ===");

		var _citizens = getCitizenCount();
		var _reds = getRolesCount('red_killers') || 0;
		var _blacks = getRolesCount('black_killers') || 0;

		console.log("CIV: "+_citizens);
		console.log("RED: "+_reds);
		console.log("BLK: "+_blacks);

		if (_reds == 0 && _blacks == 0) {
			alert("WINNER: CIVILIANS");
			return true;
		} else if (_reds >= _citizens && _blacks == 0) {
			alert("WINNER: REDS");
			return true;
		} else if (_blacks >= _citizens && _reds == 0) {
			alert("WINNER: BLACKS");
			return true;
		} else {
			return false;
		}
	}

	function updateGamelog() {
		
		$('.gamelog .turns').empty();
		$('.gamelog .results').empty();
		$('.gamelog .players').empty();

		$.each(GAME.summary, function(index,value) {

			if (GAME.summary[index].round == GAME.round) {
				$('.gamelog .turns').append("<tr><td>"+GAME.summary[index].sentence+"</td></tr>");
			}

		});

		var nicePlayers = $.extend([], GAME.players);

		sortObjAlpha(nicePlayers, "role");

		$.each(nicePlayers, function(index,value) {

			if (nicePlayers[index].alive == true) {
				$('.gamelog .players').append("<tr><td>"+nicePlayers[index].role+"</td><td>"+nicePlayers[index].name+"</td></tr>");
			}

		});

		var affected = getPlayersWithStatus();

		sortObj(affected, 'alive');

		$.each(affected, function(index,value) {

			if (affected[index].alive == false) {
				var _sentence = affected[index].name+ " was killed.";
				$('.gamelog .results').append('<li>'+_sentence+'</li>');
			}
			if (affected[index].status.indexOf('silenced') >= 0) {
				var _sentence = affected[index].name+ " was silenced.";
				$('.gamelog .results').append('<li>'+_sentence+'</li>');
			}


		});

		$('.gamelog').addClass('js-active');
	
	}

	$(document).on('click', '.js-dismiss', function(event) {

		$('.gamelog').removeClass('js-active');
		// var affected = getPlayersWithStatus();

	});

	$(document).on('click', '.js-abstain', function(event) {

		$(this).toggleClass('js-selected');
		if ($(this).hasClass('js-selected')) {
			$('.board .players .player').removeClass('js-selected');
			$('.board .players .player').addClass('js-noselect');
		} else {
			$('.board .players .player').removeClass('js-noselect');
		}

	});

});

/* ==== HELPERS ==== */

function updatePlayerAttribute(id, property, value) {

	GAME.players.filter(obj => {
	  if(obj.id === id) {
	  	if (property == "status" && obj.status.indexOf(value) < 0) {
	  		obj.status.push(value);
	  	} else {
	  		obj[property] = value;
	  	}
	  }
	});

}

function removePlayerStatus(id, status) {

	GAME.players.filter(obj => {
	  if(obj.id === id) {
	  	var _temp = obj.status;
	  	var _index = _temp.indexOf(status);
	  	_temp.splice(_index, 1);
	  	obj.status = _temp;
	  }
	});

}


function clearPlayerStatuses() {

	$.each(GAME.players, function(key,value) {
		GAME.players[key].status = [];
	});

}

function getPlayerName(id) {

	var match = GAME.players.filter(obj => obj.id === id);
	return match[0].name;

}


function getPlayerWithStatus(status) {

	var match = GAME.players.filter(obj => obj.status.indexOf(status) >= 0);
	return match[0];

}

function getPlayersWithStatus() {

	var match = GAME.players.filter(obj => obj.status.length > 0);
	return match;

}

function getSetupRolesCount(role) {

	var match = GAME.roles.filter(obj => obj.type === role);
	return match[0].count;

}

function getCitizenCount() {

	var match = GAME.players.filter(obj => obj.alive == true && obj.team == "citizens");
	return match.length;

}

function getRolesCount(role) {

	//change this to loops through roles array;
	if (role) {
		var match = GAME.players.filter(obj => obj.alive == true && obj.role === role);
		return match.length;
	} else {
		var _countObj = [];

		$.each(GAME.roles, function(key,value) {
			var match = GAME.players.filter(obj => obj.alive == true && obj.role === GAME.roles[key].type);
			_countObj.push({
				type: GAME.roles[key].type,
				current: match.length,
				players: match
			});
		});

		// var citizen = GAME.players.filter(obj => obj.alive === true && obj.role === "citizen");

		// _countObj.push({
		// 	type: "citizen",
		// 	current: citizen.length,
		// 	players: citizen
		// });

		console.log(_countObj);
	}
}

function getRoleAbility(role) {

	var match = GAME.roles.filter(obj => obj.type === role)
	return match[0].ability;

}

function sortObj(obj, property) {

	obj.sort((a, b) => (a[property] > b[property]) ? 1 : -1);

}

function sortObjAlpha(obj, property) {
	obj.sort(function (a, b) {
      if (a[property] < b[property]) return 1;
      else if (a[property] > b[property]) return -1;
      return 0;
    });
}

function onlyUnique(value, index, self) { 
    return self.indexOf(value) === index;
}

function enablePlayerSelection(type) {

	if (type == "vote" || type == "target") {
		$(document).on('click', '.board .players .player', function(event) {
			$('.board .players .player').removeClass('js-selected');
			$(this).toggleClass('js-selected');
		});
	} else {
		$(document).on('click', '.board .players .player', function(event) {
			if (getSetupRolesCount(type) > 1) {
				if ($('.js-selected').length < getSetupRolesCount(type)) {
					$(this).toggleClass('js-selected');
				} else {
					$(this).removeClass('js-selected');
				}
			} else {
				$('.board .players .player').removeClass('js-selected');
				$(this).toggleClass('js-selected');
			}
		});
	}
	
}

function nextRoleTurn(role) {

	index = GAME.roles.findIndex(obj => obj.type==role);
	if (index < GAME.roles.length-1) {
		return GAME.roles[index+1].type;
	} else {
		return "vote";
	}

}

function showScript(string) {

	$('.script').empty();
	$('.script').html(string);

}

function showInstruction(string) {

	$('.instruction').empty();
	$('.instruction').html(string);

}
