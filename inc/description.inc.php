<?php 
if($ajax) {
  echo '<div class="row">
			<!--Main Content -->
			<div class="col-xs-9">
				<h1>Описание сайта</h1>
				<section id="first">	  
					<h2>Языки, технологии и СУБД, использованные при создании сайта</h2> 
					<ol>
						<li>HTML</li> 
						<li>CSS</li> 
						<li>Javascript (библиотеки jQuery, jQuery-UI)</li>
						<li>фреймворк Bootstrap</li> 
						<li>AJAX</li> 
						<li>PHP</li> 
						<li>СУБД MySQL</li> 
					</ol>
					<p>Работа сайта протестирована в следующих браузерах:</p>
					<ul>
						<li>Google Chrome, версия 51.0.2704.103</li> 
						<li>Firefox, версия 47</li> 
						<li>Internet Explorer, версия 11.0.9600.18059</li>
						<li>Opera, версия 38</li> 
					</ul>
				</section>	
				<section id = "filesDescription">	
					<h2>Описание файлов и папок сайта</h2>
					<p>Репозиторий на <a href ="https://github.com/EAKusakina/a-diary" target="_blank">GitHub.com</a></p> 
					<ul>
						<li id = "indexPHP">
							<dl>
								<dt>index.php</dt>
								<dd>Основной HTML-шаблон сайта, куда подключаются все необходимые файлы и на основании которого формируются страницы сайта.</dd>
							</dl>
						</li>
						<li id = "PHP">
							<dl>
								<dt>папка php:</dt>
								<dd>Содержит файлы с php-скриптами, обеспечивающими работу сайта. Схема подключения файлов представлена на рисунке:<br>
									<img class="img-responsive" src="/img/php_files_scheme.jpg" alt="php_files_scheme"/>
									<ul>
										<li>
											<dl>
												<dt>папка "Support"</dt>
												<dd>Содержит файлы с описанием классов, трейтов и функций, которые используются в файлах из родительской папки ("php").<br>
													<ul>
														<li>
															<dl>
																<dt>ErrorsAndExceptions.php</dt>
																<dd>Содержит пользовательские обработчики ошибок и класс ExceptionForUser, обрабатывающий исключения, возникающие из-за проблем на сервере.<br>
																Данный файл включен во все остальные файлы проекта напрямую или через DataBase</dd>
															</dl>
														</li>
														<li>
															<dl>
																<dt>DataBase.trait.php</dt>
																<dd>Трейт DataBase отвечает за получение и редактирование информации в базе данных, а также содержит методы для старта сессии и проверки авторизован ли пользователь, которые применяются перед осуществлением доступа к базе данных.</dd>
															</dl>
														</li>
														<li>
															<dl>
																<dt>AjaxRequest.class.php</dt>
																<dd>Содержит класс AjaxRequest, свойства и методы которого используются для высокоуровневой  обработки Ajax-запросов (проверки на корректность переданных параметров и метода запроса, формирование ответа клиенту и др.).</dd>
															</dl>
														</li>
														<li>
															<dl>
																<dt>User.class.php</dt>
																<dd>Содержит класс User, свойства и методы которого используются при выходе с сайта, при регистрации/авторизации пользователя (в том числе обеспечивая шифрование пароля, создание и проверку "соли"), и через трейт DataBase взаимодействуют с БД.</dd>
															</dl>
														</li>
													</ul>
												</dd>
											</dl>
										</li>
										<li>
											<dl>
												<dt>authorization.php</dt>
												<dd>Содержит класс AuthorizationAjaxRequest, который, используя AjaxRequest.class.php и User.class.php, обеспечивает регистрацию и авторизацию пользователя, а также выход (logout) пользователя с сайта.</dd>
											</dl>
										</li>
										<li>
											<dl>
												<dt>categoriesHandler.php</dt>
												<dd>Содержит класс Category, который, используя AjaxRequest.class.php, обеспечивает выборку, добавление, редактирование и удаление категорий событий.</dd>
											</dl>
										</li>
										<li>
											<dl>
												<dt>eventsHandler.php</dt>
												<dd>Содержит класс Event, который, используя AjaxRequest.class.php, обеспечивает выборку, добавление, редактирование и удаление событий.</dd>
											</dl>
										</li>
										<li>
											<dl>
												<dt>finishingRegister.php</dt>
												<dd>Содержит класс FinishingRegister, который, используя DataBase.trait.php, обеспечивает завершение регистрации пользователя, когда пользователь переходит по присланной ему e-mail ссылке (проверяет верен ли код для активации, устанавливает в БД соответствующий статус, если пользователь подтвердил e-mail, и др.).</dd>
											</dl>
										</li>
										<li>
											<dl>
												<dt>loadPage.php</dt>
												<dd>Обрабатывает ajax-запросы по получению контента для наполнения страниц (использует ErrorsAndExceptions.php).</dd>
											</dl>
										</li>
										<li>
											<dl>
												<dt>accessToDB.txt</dt>
												<dd>Файл с параметрами доступа к базе данных.</dd>
											</dl>
										</li>
										<li>
											<dl>
												<dt>client_error.txt</dt>
												<dd>Лог ошибок, возникающих по вине клиента (неверные параметры запроса, неверный метод запроса, неверный uri и т.д.)</dd>
											</dl>
										</li>
										<li>
											<dl>
												<dt>server_error.txt</dt>
												<dd>Лог ошибок, возникающих по вине сервера (нет подключения к БД, ошибка в запросе и т.д.).</dd>
											</dl>
										</li>
									</ul>
								</dd>
							</dl>
						</li>
						<li id = "JS">
							<dl>
								<dt>папка js</dt>
								<dd>Содержит файлы с собственными и заимствованными (библиотеки jQuery, jQuery-UI, Bootstrap и функция для шифрования md5) js-скриптами.<br> 
								Ниже приведено описание собственных js-скриптов:<br>
									<ul>
										<li>
											<dl>
												<dt>authorization.js</dt>
												<dd>Содержит функции, обеспечивающие регистрацию, авторизацию пользователя, а также выход пользователя с сайта с помощью обработчиков для формы авторизации, модального окна для регистрации и ссылки для выхода.</dd>
											</dl>
										</li>
										<li>
											<dl>
												<dt>categories.js</dt>
												<dd>Содержит функции, обеспечивающие:<br>
													<ul>
														<li> получение списка категорий из базы данных,</li> 
														<li> просмотр, добавление, редактирование и удаление категорий.</li>
													</ul>
												</dd>
											</dl>
										</li>
										<li>
											<dl>
												<dt>events.js</dt>
												<dd>Содержит функции, обеспечивающие:<br>
													<ul>
														<li> получение списка событий за выбранную дату из базы данных,</li> 
														<li> просмотр, добавление, редактирование, копирование и удаление событий.</li> 
													</ul>
												</dd>
											</dl>
										</li>
										<li>
											<dl>
												<dt>export.js</dt>
												<dd>Содержит функции, обеспечивающие создание текстового файла с расширением xls, содержащего список событий за выбранный пользователем временной период. Данный файл может быть открыт с помощью Microsoft Excel.</dd>
											</dl>
										</li>
										<li>
											<dl>
												<dt>init.js</dt>
												<dd>Проверяет авторизован ли пользователь и, в зависимости от этого, обеспечивает показ соответствующей(-их):<br>
													<ul>
														<li> шапки сайта(форма для регистрации/авторизации либо ссылка "Вход выполнен"),</li>
														<li> пунктов меню (незарегистрированным пользователям недоступен основной функционал сайта т.е. работа с событиями, они могут видеть только главную страницу и страницу с описанием технических деталей реализации сайта, на которой Вы сейчас находитесь),</li>
														<li> контента страницы (варианты: запрошенный контент, страница-обработчик 404 ошибки, страница с указанием, что данный контент доступен только зарегистрированным пользователям и др.).</li>
													</ul>
												Также содержит обработчики переходов по меню, нажатия на кнопки "вперед" и "назад", и на логотип.
												</dd>
											</dl>
										</li>
										<li>
											<dl>
												<dt>proto.js</dt>
												<dd>Содержит использующиеся в других файлах функции и родительские конструкторы для ajax-запросов, категорий и событий</dd>
											</dl>
										</li>
									</ul>
								</dd>
							</dl>
						</li>
						<li id = "CSS">
							<dl>
								<dt>папка css</dt>
								<dd>Содержит css и img файлы библиотек (jQuery, jQuery-UI, Bootstrap), а также собственный (пользовательский) файл style.css.</dd>
							</dl>
						</li>
						<li id = "dest">
							<dl>
								<dt>папка dest</dt>
								<dd>Содержит css и js файлы, полученные с помощью Grunt, то есть склеенные, минимизированные, очищенные от console.log, и использующиеся непосредственно на сайте.</dd>
							</dl>
						</li>
						<li id = "fonts">
							<dl>
								<dt>папка fonts</dt>
								<dd>Содержит файлы шрифтов glyphicons, используемых в Bootstrap.</dd>
							</dl>
						</li>
						<li id = "IMG">
							<dl>
								<dt>папка img</dt>
								<dd>Содержит ajax-loader.gif, которая выводится на экран пока не подгрузился запрошенный ajax-запросом контент страницы, а также схему php-файлов сайта, которая используется на данной странице.</dd>
							</dl>
						</li>
						<li id = "inc">
							<dl>
								<dt>папка inc</dt>
								<dd>Содержит страницы с контентом, который отображается на сайте в зависимости от введенного пользователем адреса и прав доступа (авторизован или нет):<br> 
									<ul>
										<li>
											<dl>
												<dt>categories.inc.php</dt>
												<dd>Контент страницы "Категории"</dd>
											</dl>
										</li>
										<li>
											<dl>
												<dt>description.inc.php</dt>
												<dd>Контент страницы "Описание сайта"</dd>
											</dl>
										</li>
										<li>
											<dl>
												<dt>events.inc.php</dt>
												<dd>Контент страницы "События"</dd>
											</dl>
										</li>
										<li>
											<dl>
												<dt>export.inc.php</dt>
												<dd>Контент страницы "Экспорт событий"</dd>
											</dl>
										</li>
										<li>
											<dl>
												<dt>index.inc.php</dt>
												<dd>Контент страницы "Главная"</dd>
											</dl>
										</li>
										<li>
											<dl>
												<dt>modal.inc.php</dt>
												<dd>Модальное окно для регистрации</dd>
											</dl>
										</li>
										<li>
											<dl>
												<dt>pageNotFound.inc.php</dt>
												<dd>Контент страницы-обработчика 404 ошибки</dd>
											</dl>
										</li>
										<li>
											<dl>
												<dt>registerError.inc.php</dt>
												<dd>Контент страницы-обработчика ошибок, возникших при подтверждении e-mail при регистрации</dd>
											</dl>
										</li>
										<li>
											<dl>
												<dt>thanksForRegister.inc.php</dt>
												<dd>Контент страницы-благодарности за регистрацию на сайте</dd>
											</dl>
										</li>
									</ul>
								</dd>
							</dl>
						</li>
						<li id = "node_modules">
							<dl>
								<dt>папка node_modules</dt>
								<dd>Содержит папки, необходимые для работы Grunt.</dd>
							</dl>
						</li>
						<li id = "gitignore">
							<dl>
								<dt>.gitignore</dt>
								<dd>Файл с перечислением файлов и папок, которые игнорируются git при создании коммитов.</dd>
							</dl>
						</li>
						<li id = "htaccess">
							<dl>
								<dt>.htaccess</dt>
								<dd>Файл с настройками для сервера, позволяющими использовать собственный обработчик 404 ошибки и ускорить скорость загрузки страниц за счет сжатия и кэширования.</dd>
							</dl>
						</li>
						<li id = "Gruntfile">
							<dl>
								<dt>Gruntfile.js</dt>
								<dd>Файл с конфигурацией задач для Grunt.</dd>
							</dl>
						</li>
						<li id = "package">
							<dl>
								<dt>package.json</dt>
								<dd>Файл с зависимостями проекта для Grunt.</dd>
							</dl>
						</li>
					</ul>				
				</section>	
				<section id = "mySQLDescr">	
					<h2>Структура таблиц СУБД MySQL</h2> 

					<table id = "users" class="table">
						<caption>Таблица "users"</caption>
						<thead>
							<tr class="info">
								<th>№ п/п</th>
								<th>Имя</th>
								<th>Тип</th>
								<th>Дополнительно</th>
							</tr>
						</thead>
						<tbody>
							<tr>
								<td>1</td>
								<td>id</td>
								<td>int(11)</td>
								<td>первичный ключ, внешний ключ, автоинкремент</td>
							</tr>
							<tr>
								<td>2</td>
								<td>username</td>
								<td>varchar(255)</td>
								<td>e-mail пользователя</td>
							</tr>
							<tr>
								<td>3</td>
								<td>password</td>
								<td>varchar(255)</td>
								<td>пароль пользователя</td>
							</tr>
							<tr>
								<td>4</td>
								<td>salt</td>
								<td>varchar(100)</td>
								<td>соль пароля</td>
							</tr>
							<tr>
								<td>5</td>
								<td>activation</td>
								<td>varchar(255)</td>
								<td>уникальный код для завершения регистрации</td>
							</tr>
							<tr>
								<td>6</td>
								<td>status</td>
								<td>tinyint(1)</td>
								<td>флаг (подтвержден или нет e-mail)</td>
							</tr>
						</tbody>
					</table>

					<table id = "all_records" class="table">
						<caption>Таблица "all_records"</caption>
						<thead>
							<tr class="info">
								<th>№ п/п</th>
								<th>Имя</th>
								<th>Тип</th>
								<th>Дополнительно</th>
							</tr>
						</thead>
						<tbody>
							<tr>
								<td>1</td>
								<td>db_id</td>
								<td>int(11)</td>
								<td>первичный ключ,  автоинкремент</td>
							</tr>
							<tr>
								<td>2</td>
								<td>user_id</td>
								<td>int(11)</td>
								<td>id пользователя, индекс(внешний ключ - id таблицы "users")</td>
							</tr>
							<tr>
								<td>3</td>
								<td>date</td>
								<td>datetime</td>
								<td>дата события</td>
							</tr>
							<tr>
								<td>4</td>
								<td>hours</td>
								<td>tinyint(1)</td>
								<td>час события</td>
							</tr>
							<tr>
								<td>5</td>
								<td>minutes</td>
								<td>tinyint(1)</td>
								<td>минута события</td>
							</tr>
							<tr>
								<td>6</td>
								<td>description</td>
								<td>varchar(500)</td>
								<td>описание события</td>
							</tr>
							<tr>
								<td>7</td>
								<td>category</td>
								<td>varchar(30)</td>
								<td>категория события</td>
							</tr>
							<tr>
								<td>8</td>
								<td>id_category</td>
								<td>int(11)</td>
								<td>id категории события</td>
							</tr>
						</tbody>
					</table>
					<table id = "all_categories" class="table">
						<caption>Таблица "all_categories"</caption>
						<thead>
							<tr class="info">
								<th>№ п/п</th>
								<th>Имя</th>
								<th>Тип</th>
								<th>Дополнительно</th>
							</tr>
						</thead>
						<tbody>
							<tr>
								<td>1</td>
								<td>id_category</td>
								<td>int(11)</td>
								<td>первичный ключ,  автоинкремент</td>
							</tr>
							<tr>
								<td>2</td>
								<td>user_id</td>
								<td>int(11)</td>
								<td>id пользователя, индекс(внешний ключ - id таблицы "users")</td>
							</tr>
							<tr>
								<td>3</td>
								<td>category</td>
								<td>varchar(30)</td>
								<td>категория события</td>
							</tr>
							<tr>
								<td>4</td>
								<td>selected</td>
								<td>tinyint(1)</td>
								<td>флаг (назначена ли категория категорией по умолчанию)</td>
							</tr>
						</tbody>
					</table>
					<div class="mar"></div>
				</section>
			</div>
				
				<!--Nav Bar -->
				<nav id="myScrollspy" class="col-xs-3 bs-docs-sidebar hidden-xs">
					<!-- с помощью атрибута data-offset- устанавливается величина смещения, которая определяет момент прикрепления элемента к верхнему или нижнему краю окна браузера.-->
					<ul id="sidebar" class="nav nav-stacked bs-docs-sidenav" data-spy="affix" data-offset-top="50">
						<li>
							<a href="#first">Языки, технологии и СУБД</a>
						</li>
						<li>
							<a href="#filesDescription">Описание файлов и папок</a>
							<ul class="nav">
								<li><a href="#indexPHP">index.php</a></li>
								<li><a href="#PHP">папка php</a></li>
								<li><a href="#JS">папка js</a></li>
								<li><a href="#dest">папка dest</a></li>
								<li><a href="#CSS">папка css</a></li>
								<li><a href="#fonts">папка fonts</a></li>
								<li><a href="#IMG">папка img</a></li>
								<li><a href="#inc">папка inc</a></li>
								<li><a href="#node_modules">папка node_modules</a></li>
								<li><a href="#gitignore">.gitignore</a></li>
								<li><a href="#htaccess">.htaccess</a></li>
								<li><a href="#Gruntfile">Gruntfile.js</a></li>
								<li><a href="#package">package.json</a></li>
							</ul>
						</li>
						<li>
							<a href="#mySQLDescr">Структура таблиц СУБД MySQL</a>
							<ul class="nav">
								<li><a href="#users">Таблица "users"</a></li>
								<li><a href="#all_records">Таблица "all_records"</a></li>
								<li><a href="#all_categories">Таблица "all_categories"</a></li>
							</ul>
						</li>
						<li>
							<a href="#top"> К началу страницы </a>
						</li>			
					</ul>
				</nav>
			</div>';
} else{
 include '../index.php';
}
