<?php 
if($ajax) {
  echo "<h1>Добро пожаловать!</h1>
<section>	  
	<h2>1. Цель сайта</h2> 

	<p>Данный сайт предназначен для ведения дневника событий.</p> 
	<p>Каждое событие содержит:</p>
	<ul>
		<li>дату события</li>
		<li>время события</li> 
		<li>описание события</li>
		<li>категорию события</li>
	</ul>	
	<p>Сайт позволяет добавлять, редактировать, удалять и копировать события.</p>
	<p>Например, если Вы следите за своим здоровьем и внешним видом, можно вести вот такой дневник приемов пищи и физической активности:</p>
	<img class='img-responsive' src='/img/diary_example.jpg' alt='diary_example'/> 

	<p>Первоначально, после регистарции на сайте, каждому пользователю предлагается 4 категории событий: food, activity, health, other. Данный список может быть изменен пользователем по его усмотрению (как в примере выше).</p>
	<p>Все события можно выгрузить в файл для последующего анализа и обработки с помощью Microsoft Excel.</p> 
</section>	  

<section>	  
	<h2>2. Описание страниц сайта</h2>
	<h3>Cтраницы, доступные для всех посетителей сайта</h3>
	<ul class='list-unstyled'>
		<li>
			<dl>
				<dt>Главная</dt>
				<dd>Содержит описание функционала и страниц сайта.</dd>
			</dl>
		</li>
		<li>
			<dl>
				<dt>Описание сайта</dt>
				<dd>Содержит описание технических деталей реализации сайта:
					<ul>
						<li>используемые языки, технологии и СУБД,</li>
						<li>описание файлов и папок сайта</li>
						<li>структура таблиц СУБД MySQL</li>
					</ul>
				</dd>
			</dl>
		</li>
	</ul>
	<h3>Cтраницы, доступные только для зарегистрированных пользователей</h3>
	<ul class='list-unstyled'>
		<li>
			<dl>
				<dt>Категории</dt>
				<dd>Содержит таблицу с категориями событий.<br> Для редактирования категорий нужно кликнуть на ячейку таблице, которую нужно скорректировать, ввести новые данные в появившемся поле и нажать кнопку 'Сохранить изменения'.</dd>
			</dl>
		</li>
		<li>
			<dl>
				<dt>События</dt>
				<dd>
					Содержит форму для добавления новых событий и таблицу, отображающую события за выбранную в форме дату.<br> 
					Для редактирования событий нужно кликнуть на ячейку таблице, которую нужно скорректировать, и ввести новые данные в появившемся поле.<br>
					Кнопка 'Обновить список' позволяет обновить таблицу с событиями за выбранную дату (например, после удаления нескольких событий).<br> 
					При перезагрузке страницы всегда выводится список событий за текущую дату.<br> 
					Кнопка 'Удалить события за все даты' позволяет безвозвратно удалить все записи о событиях, когда-либо сделанные пользователем.
				</dd>
			</dl>
		</li>
		<li>
			<dl>
				<dt>Эспорт событий</dt>
				<dd>Содержит форму, позволяющую выбрать диапазон дат, события за который следует выгрузить в текстовый файл. Данный файл затем можно будет открыть с помощью Microsoft Excel.</dd>
			</dl>
		</li>
	</ul>
</section>	  

";
} else{
  include '../index.php';
}
