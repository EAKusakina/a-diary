
$(document).ready(function() {

	//редактирование поля "Категория" таблицы 
	$('body').on('click','#categories .category', function(e){
		var that = $(this);
		var par = checkClick(e, 'input', $(this));
		if (!par)
			return false;
		//иначе получаем содержимое ячейки
		var oldVal = $(this).html();
		//формируем код текстового поля
		var code = '<input type="text" id="edit" value="'+oldVal+'" />';
		//удаляем содержимое ячейки, вставляем в нее сформированное поле
		$(this).empty().append(code);
		$('button').addClass('disabled').removeClass('active');
		//устанавливаем фокус на это новое поле
		$('#edit').focus();
		$('#edit').blur(function()	{
			//получаем то, что находится в поле при снятии фокуса
			var newVal = $(this).val();
			if (newVal !== oldVal){
				//если новое значение - пустая строка или строка из одних пробелов
				if ((newVal == "") || (!/\S/.test(newVal))){
					alert("Для удаления категории поставьте галку в столбце 'Удалить'");
					$(that).empty().html(oldVal);
					if (!isEmpty(categories.updObj))
						$('button').addClass('active').removeClass('disabled');
					return false;	
				}
				categories.editObj($(par).attr('class'), 'category', newVal);
				//находим ячейку, удаляем устаревшее содержимое и вставляем значение из поля
				$(that).empty().html(newVal).addClass("editedField");
			}
			else 
				$(that).empty().html(oldVal);				
		});
	});
	
	//редактирование поля "Выбирать по умолчанию" таблицы 
	$('body').on('click','.setSelected', function(e){
		var $that = $(this); //тут чекбокс
		var td = $that.parent();//тут родительский td чекбокса 
		//если ячейка зачеркнута т.е. строка была удалена, выходим из функции
		if (td[0].outerHTML.indexOf("line-through")!= -1)
			return false;
		//получили предка: tr(input '.setSelected'->td->tr)
		var par = $that.parent().parent();
			
		var copyArr = $('body #categories .setSelected');
		var copyArrLength = copyArr.length;  
		for (var i = 0; i<copyArrLength; i++){
			if (copyArr[i].checked){
				//получили имя класса - номер категории
				var parentClass = copyArr[i].parentNode.parentNode.className;
				if ($(par).attr('class') != parentClass)
					categories.editObj(parentClass, 'selected', 0);				
			}
			copyArr[i].checked = false;
		};
		$that.prop('checked', true);	
		categories.editObj($(par).attr('class'), 'selected', 1);
	});	

	//удаление категории
	$('body').on('click','.delCat', function(elem){
		//получили предка: tr(input 'del'->td->tr)
		var par = $(this).parent().parent();
		//если чекбокс выбран
		if ($(this).prop('checked')){
			//проверим, не является ли эта категория выбираемой по умолчанию
			var defaultCheckbox = $(this).parent().prev().children();
			if (defaultCheckbox[0].checked){
				$(this).prop('checked', false);
				alert("Невозможно удалить категорию, которая выбирается по умолчанию. Для удаления данной категории установите другую категорию по умолчанию и затем удалите эту.");
				return;
			}
			//зачеркнем содержимое всей строки
			$(par).find('td').css('text-decoration','line-through');
			//(true=1 или false=0); если передавать просто true или false, то на сервере false воспринимается как строка и равен true, а 0 и "0" в php равны false
			categories.editObj($(par).attr('class'), 'deleted', 1);
		}
		else {
			//сделаем содержимое всей строки незачеркнутым
			$(par).find('td').css('text-decoration','none');
			categories.editObj($(par).attr('class'), 'deleted', 0);
		}	
	});	
	
	//добавление категории 
	$('body').on('click','#categories .addCat', function(e){
		var that = $(this);
		var par = checkClick(e, 'input', $(this));
		if (!par)
			return false;
		//иначе получаем содержимое ячейки
		var oldVal = $(this).html();
		//формируем код текстового поля
		var code = '<input type="text" id="edit" value="" />';
		//удаляем содержимое ячейки, вставляем в нее сформированное поле
		$(this).empty().append(code);
		$('button').addClass('disabled').removeClass('active');
		//устанавливаем фокус на это новое поле
		$('#edit').focus();
		$('#edit').blur(function()	{
			//получаем то, что находится в поле при снятии фокуса
			var newVal = $(this).val();
			//если новое значение - пустая строка или строка из одних пробелов
			if ((newVal == "") || (!/\S/.test(newVal))){
				alert("Невозможно сохранить пустую категорию");
				$(that).empty().html(oldVal);
				if (!isEmpty(categories.updObj))
					$('button').addClass('active').removeClass('disabled');
				return false;	
			}
			//создаем новую категорию с временным номером 
			var tmpID = "tmp_"+Math.floor(Math.random() * (99999999999 + 1));
			var tmpObj = {};
			tmpObj[tmpID] = {};
			tmpObj[tmpID]['category'] = newVal;
			tmpObj[tmpID]['selected'] = 0;	
			categories.editObj(tmpID, 'added', tmpObj[tmpID]);
			//добавили возможность изменять новую категорию
			$(that).empty().html(newVal).removeClass('addCat').addClass("editedField").addClass("category");
			//разблокировали возможность удалить либо выбрать по умолчанию новую категорию
			$(par).children().children().prop("disabled", false);
			//добавили к строкн класс с временным номером новой категории
			$(par).addClass(tmpID);
			$(par).after("<tr><td class = 'addCat'>Введите название категории</td><td><input class ='setSelected' disabled type='checkbox'></td><td><input class ='delCat' disabled type='checkbox'></td></tr>");
		});
	});


	$('body').on('click','#saveChanges', function(){
		var wereInDelete = false;
		for (var i in categories.updObj){
			if (categories.updObj[i]['deleted'] == 1) {
				if (!wereInDelete)
					var confirmDelete =	confirm("В списке категорий на изменение есть удаленная(-ые). Если категория была использована при создании записей, то после ее удаления поле 'Категория' указанных записей станет пустым. Вы подтверждаете удаление выбранной(-ый) категории(-й)? (ОК - 'Подтверждаю', Отмена - 'Отменить удаление (остальные изменения будут сохранены)')");
				wereInDelete = true;
				if (confirmDelete)
					continue;
				else
					delete categories.updObj[i]['deleted'];
			}
			if (categories.updObj[i]['added'] !== undefined)
				continue;
			if (categories.updObj[i]['category'] == categories.obj[i]['category'] && 
				categories.updObj[i]['selected'] == categories.obj[i]['selected'])
				delete categories.updObj[i];
		}	
		console.log(categories.updObj);
		if (!isEmpty(categories.updObj))
			categories.requestToDB(ajaxObj,'updCategories', JSON.stringify(categories.updObj));
	});

	$('body').on('click','#cancel', function(){
		categories.updObj = {};
		categories.showCategories();
		$('button').addClass('disabled').removeClass('active');
	});
	
	//Дочерний конструктор для категорий
	function Categories (){
		CategoriesParent.apply(this, arguments);
	}
	//Наследование свойств и методов родительского конструктора (определен в файле proto.js) 
	Categories.prototype = Object.create(CategoriesParent.prototype);
	Categories.prototype.constructor = Categories;

	//Методы дочернего конструктора для категорий - в прототип 
	Categories.prototype.editObj = function (idElem, attribute, newVal){
		if (this.updObj[idElem] == undefined)
			this.updObj[idElem] = {};
		this.updObj[idElem][attribute] = newVal;
		$('button').addClass('active').removeClass('disabled');
	};
	
	Categories.prototype.showCategories = function (){
		var headArr = ['Категория', 'Выбирать по умолчанию', "<input id='cleanAllCat' type='checkbox'> Удалить"];
		var table = createEmptyTable(headArr);
		var tbody = table.children()[1];
		var row;

		for (var i in this.obj){
			row = $('<tr></tr>').attr({ class: i }).appendTo(tbody);
			$('<td></td>').attr({ class:"category"}).html(this.obj[i]['category']).appendTo(row);
			if (this.obj[i]['selected'] == 1)
				$('<td></td>').html("<input class ='setSelected' type='checkbox' checked>").appendTo(row);
			else
				$('<td></td>').html("<input class ='setSelected' type='checkbox'>").appendTo(row);				
			$('<td></td>').html("<input class ='delCat' type='checkbox'>").appendTo(row); 
		}
		row = $('<tr></tr>').appendTo(tbody);
		$('<td></td>').attr({ class:"addCat"}).html('Введите название категории').appendTo(row);
		$('<td></td>').html("<input class ='setSelected' type='checkbox' disabled>").appendTo(row);				
		$('<td></td>').html("<input class ='delCat' type='checkbox' disabled>").appendTo(row); 
		$('#categories').html(table);
		$('#buttons').html("<div class='col-md-2 col-md-offset-3 col-sm-2 col-sm-offset-2'><button id='saveChanges' type='submit' class='btn btn-success disabled'>Сохранить изменения</button></div><div class='col-md-3 col-sm-offset-2 col-sm-3'><button id='cancel' type='submit' class='btn btn-default disabled'>Отменить изменения</button></div>");		
	}
	//обновляет категории событий в локальном хранилище, если категории успешно обновлены на сервере
	Categories.prototype.updLocalStorage = function (updObj){
		if (eventsObj.getArrFormStorage (storageName)){
			for (var i in eventsObj.arr){
				var j = eventsObj.arr[i]['id_category'];
				if (j in updObj){
					if (updObj[j]['deleted'] == 1) {
						eventsObj.arr[i]['category'] = "";
						continue;
					} 
					if (updObj[j]['category'] != undefined) 
						eventsObj.arr[i]['category'] = updObj[j]['category'];
				} 
			}
			localStorage.setItem(storageName, JSON.stringify(eventsObj.arr));
		}
	}
	
	var categories = new Categories ();
	var ajaxObj = new AjaxRequestParent();
	var eventsObj = new EventsParent ();

	$('body').on('loadCategories','#data', function(){
		categories.requestToDB(ajaxObj, 'getCategories');
	});

});
