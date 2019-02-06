$(function() {

	var CORE = {};

	// CORE.total = prompt('How many participants?');

	// // console.log(CORE.total);

	// for (var i=0; i<CORE.total; i++) {
	// 	var template = $('.template .person').clone();
	// 	$('.people').append(template);
	// }

	var data = [];
	// var data = [
	// 			['cs', 9],
	// 			['cd', 2],
	// 			['jv', 3],
	// 			['sc', 4],
	// 			['mm', 2],
	// 			['hl', 7],
	// 		   ];

	var wl;
	var totalOdds = 0;

	$('.add').on('click', function(event){
		var template = $('.template .person').clone();
		$('.people').append(template);
	});



	$('.lock').on('click', function(event) {

		if($('.people .person').find('.name').val() == '' || $('.people .person').find('.probability').val() == ''){
		    alert('Input can not be left blank');
		    return;
		}


		$('.people .person').each(function(i, obj) {

			// console.log($(obj).find('.name').val());
			// console.log($(obj).find('.probability').val());

			var _name = $(obj).find('.name').val();
			var _prob = $(obj).find('.probability').val();
			
			data.push([_name, Number(_prob)]);
		});

		console.log(data);
		$(this).prop('disabled', true);
		$('.choose').prop('disabled', false);

		wl = new WeightedList(data);
		// console.log(wl);

		const entries = Object.entries(wl.weights);
		console.log(entries);

		for (var i=0; i<entries.length; i++) {
			console.log(entries[i][1]);
			totalOdds += entries[i][1];
		}
		console.log(totalOdds);

		for (var i=0; i<entries.length; i++) {
			$('.remaining table').append('<tr><td>'+entries[i][0]+'</td><td>'+(entries[i][1]/totalOdds*100).toFixed(2)+'%</td></tr>');
		} 

	});

	var index = 1;
	

	$('.choose').on('click', function(event) {

		var result = wl.pop(1);
		$('.chosen table').append('<tr><td>'+result+'</td><td><strong>Pick '+index+'</strong></td></tr>');
		index++;

		const entries = Object.entries(wl.weights);
		console.log(entries);

		var updatedOdds = 0;

		for (var i=0; i<entries.length; i++) {
			console.log(entries[i][1]);
			updatedOdds += entries[i][1];
		}

		$('.remaining table').empty();
		for (var i=0; i<entries.length; i++) {
			$('.remaining table').append('<tr><td>'+entries[i][0]+'</td><td>'+(entries[i][1]/updatedOdds*100).toFixed(2)+'%</td></tr>');
		} 

	});

	$('.reset').on('click', function(event) {

		if (confirm('Are you sure you want to reset?')) {
		    // Save it!
		    $('.remaining table').empty();
		    data = [];
		    wl = [];
		    index = 1;
		    totalOdds = 0;
		    $('.people').empty();
		    var template = $('.template .person').clone();
		    $('.people').append(template);
		    $('.chosen table').empty();
		    $('.add').prop('disabled', false);
		    $('.lock').prop('disabled', false);
		    $('.choose').prop('disabled', true);

		} else {
		    // Do nothing!
		}

	});

	$('.example').on('click', function(event) {

			$('.remaining table').empty();
			data = [];
			wl = [];
			index = 1;
			totalOdds = 0;
			$('.people').empty();
			$('.chosen table').empty();
			$('.add').prop('disabled', true);
			$('.choose').prop('disabled', true);
			$('.lock').prop('disabled', false);

			fakedata = [
					['Chris + Sumeet', 9],
					['Christine + Dan', 2],
					['Justin + Vivian', 3],
					['Spencer + Cindy', 4],
					['Marcus + Meghan', 2],
					['Hewett + Will', 7],
				   ];

			for (var i=0; i<fakedata.length; i++) {
				var template = $('.template .person').clone();
				template.find('.name').val(fakedata[i][0]);
				template.find('.probability').val(fakedata[i][1]);
				$('.people').append(template);
			}

	});

});