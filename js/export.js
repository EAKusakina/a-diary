
/*
function tableToExcel (table, name, filename) {
      var uri = 'data:application/vnd.ms-excel;base64,'
      , template = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40"><head><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>{worksheet}</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--></head><body><table>{table}</table></body></html>'
      , base64 = function (s) { return window.btoa(unescape(encodeURIComponent(s))) }
      , format = function (s, c) { return s.replace(/{(\w+)}/g, function (m, p) { return c[p]; }) }
      var ctx = { worksheet: name || 'Worksheet', table: table.html() };
      window.location.href = uri + base64(format(template, ctx));
      window.location.download = filename;
   }
*/
//tableToExcel ($('#dvData'), 'name', 'filename');


$(document).ready(function() {

	$('body').on('click','#getFile', function(e){
		e.preventDefault();
		/*Internet Media Types[1] — типы данных, которые могут быть переданы посредством сети интернет с применением стандарта MIME. 
		Вендорные файлы включают в себя и:
			application/vnd.ms-excel (Excel-файлы типа BIFF) 
			application/vnd.openxmlformats-officedocument.spreadsheetml.sheet (Excel-файлы с версии Excel 2007 и выше)
		The Excel file format is named BIFF (Binary Interchange File Format). It is used to store all types of documents: worksheet documents, workbook documents , and workspace documents . There are different versions of this file format, depending on the version of Excel that has written the file, and depending on the document type.
		*/
//console.log($('#dvData').html());

		if (firstDate > secondDate) {
			var tmp = firstDate;
			firstDate = secondDate;
			secondDate = tmp;
		}
			
		var tmpArr = [];
		for (var i in eventObj.arr){
			if (eventObj.arr[i].date >= firstDate && eventObj.arr[i].date <= secondDate  && !eventObj.arr[i].wasDeleted){
				var tmpElem = jQuery.extend({}, eventObj.arr[i]);
				tmpElem.id = i;
				tmpArr.push(tmpElem);
			}
		}
		tmpArr.sort(function (a, b){
			/*При сравнении дат в JavaScript необходимо иметь в виду, что оператор == возвращает значение true, только если даты с его обеих сторон относятся к одному и тому же объекту.  Поэтому при наличии двух отдельных объектов Date, для которых задана одна и та же дата, оператор date1 == date2 возвращает значение false. Поэтому для сравнения дат на равенство использую их строковые представления */
			var aDate = a.date.toDateString();
			var bDate = b.date.toDateString();
			
			switch (aDate == bDate) {
				case true:
					switch (a.hours == b.hours) {
						case true:
							if (a.minutes > b.minutes) 
								return 1;
							else 
								return -1;
						case false:
							if (a.hours > b.hours)
								return 1;
							else 
								return -1;							
					}
				case false:
					if (a.date > b.date)
						return 1;
					else 
						return -1;							
			}
		});

		var headArr = ['Дата', 'Время', 'Описание', 'Категория'];
		var table = createEmptyTable(headArr);
		var tbody = table.children()[1];
		var counter = 0, row;
		var options = {
					year: 'numeric',
					month: '2-digit',
					day: 'numeric',
			};
		tmpArr.forEach(function(item){
			row = $('<tr></tr>').appendTo(tbody);
			var date = item.date.toLocaleString("ru", options);
			var h = (item.hours < 10) ? "0" + item.hours : item.hours;
			var m = (item.minutes < 10) ? "0" + item.minutes : item.minutes;
			$('<td></td>').html(date).appendTo(row); 
			$('<td></td>').html(h + ":" + m).appendTo(row); 
			$('<td></td>').html(item.description).appendTo(row); 
			$('<td></td>').html(item.category).appendTo(row); 
			counter++;		 			
		});	
		if (counter == 0){
			row = $('<tr></tr>').appendTo(tbody);
			$('<td></td>').html("<b>Нет данных за выбранные даты</b>").appendTo(row); 
		}
		window.open('data:application/vnd.ms-excel,' + '\uFEFF' + encodeURIComponent('<table>'+table.html()+'</table>'));		
	});

	//Дочерний конструктор для событий
	function Events (){
		EventsParent.apply(this, arguments);
	}
	//Наследование свойств и методов родительского конструктора (определен в файле proto.js) 
	Events.prototype = Object.create(EventsParent.prototype);
	Events.prototype.constructor = Events;

	//получает список событий из хранилища или БД
	Events.prototype.getEventsList = function (){
		//Eсли нет локального хранилища с ключом storageName,
		if (!this.getArrFormStorage(storageName)){
			//то пробуем получить массив из БД
			this.getArrFormDB(ajaxObject, {updateType: ""});
		}
	};
	
	//если поместить в начало документа, то не найдет определенные ниже функции типа Events.prototype.getEventsList
	var eventObj = new Events ();
	var firstDate, secondDate;

	$('body').on('export','#data', function(){
		//загрузили массив событий
		eventObj.getEventsList();
//		console.log(eventObj.arr);
		
		//начало периода
		$('#datepicker1').datepicker({ 
			dateFormat: 'dd-mm-yy', 
			onSelect: function (dateText, inst) {
				firstDate = getSelectedDate(inst);
				/*если удалить все из поля ввода или набрать там бессмысленный набор цифр, то будет использоваться последняя выбранная дата либо сегодняшняя дата*/
			},
			onClose: function (dateText, inst){
/*				console.log(inst);				
				console.log("dateText = "+dateText);								
				console.log("firstDate = "+firstDate);				
*/			}
		});
		//окончание периода
		$('#datepicker2').datepicker({ 
			dateFormat: 'dd-mm-yy', 
			onSelect: function (dateText, inst) {
				secondDate = getSelectedDate(inst);
			}
		});		
		
		/*инициализация элементов формы при загрузке страницы*/
		
		//дата самой ранней записи, сделанной пользователем 
		$('#datepicker1').datepicker('setDate', function (){
			var today = new Date(), 
				result;			
			if (isEmpty(eventObj.arr))
				return today;
			var tmpDate = new Date(2099,01,01);
			for (var i in eventObj.arr ){
				if (eventObj.arr[i].date < tmpDate && !eventObj.arr[i].wasDeleted){
					tmpDate = eventObj.arr[i].date;
				}
			}
			if (tmpDate < new Date(2099,01,01))
				result = tmpDate;
			else 
				//если оказалось, что, например, список событий не пустой, но все они с признаком wasDeleted
				result = today;
			firstDate = result;
			return result;
		}());
		
		//дата самой поздней записи, сделанной пользователем 
		$('#datepicker2').datepicker('setDate', function (){
			var today = new Date(), 
				result;			
			if (isEmpty(eventObj.arr))
				return today;
			var tmpDate = new Date(00,01,01);
			for (var i in eventObj.arr ){
				if (eventObj.arr[i].date > tmpDate && !eventObj.arr[i].wasDeleted){
					tmpDate = eventObj.arr[i].date;
				}
			}
			//если найденная дата больше минимальной и сегодняшней
			if (tmpDate > new Date(00,01,01) && tmpDate>today) 
				result = tmpDate;
			else 
				result = today;
			secondDate = result;
			return result;
		}());

	});

});
