<?php 
if($ajax) {
  echo '		<!-- Модальное окно для регистрации -->
		<div id="registerModal" class="modal fade" role="dialog">
			<div class="modal-dialog">
				<div class="modal-content">
					<div class="modal-header">
						<button type="button" class="close" data-dismiss="modal">&times;</button>
						<h4 class="modal-title">Регистрация</h4>
					</div>
					<div class="modal-body">
						<form id="registerForm" class="form-horizontal enter" role="form" >
							<div class="form-group has-feedback">
								<label for="Email" class="col-sm-4 control-label">E-mail:</label>   
								<div class="col-sm-7">
									<div class="input-group">
										<span class="input-group-addon"><i class="glyphicon glyphicon-envelope"></i></span>
										<input type="email" class="form-control" required="required" name="Email" placeholder="E-mail" data-toggle="tooltip" title="" data-original-title="Введите E-mail в правильном формате">
									</div>
								</div>
							</div>
							<p class = "main-error"></p>
							<div class="form-group  has-feedback">
								<label for="Password" class="col-sm-4 control-label">Пароль:</label> 
								<div class="col-sm-7">
									<div class="input-group">
										<span class="input-group-addon"><i class="glyphicon glyphicon-lock"></i></span>         
										<input type="password" class="form-control" name="Password" placeholder="Пароль" required="required" data-toggle="tooltip" title="" data-original-title="Пароль должен быть длиннее 5 символов">
									</div>	
								</div>
							</div>
							<div class="form-group has-feedback">
								<label for="repeatPassword" class="col-sm-4 control-label">Повторите пароль:</label> 
								<div class="col-sm-7">
									<div class="input-group">
										<span class="input-group-addon"><i class="glyphicon glyphicon-lock"></i></span>         
										<input type="password" class="form-control" name="repeatPassword" placeholder="Пароль" required="required" data-toggle="tooltip" title="" data-original-title="Пароли должны совпадать">
									</div>	
								</div>
							</div>
							<div class="form-group  has-feedback">
								<label for="ControlSum" class="col-sm-4 control-label">Введите сумму:</label>   
								<div class="col-sm-2">
									<span id="aspm"></span>
								</div>
								<div class="col-sm-5">
									<input type="text" class="form-control" name="ControlSum" placeholder="Введите сумму" data-toggle="tooltip" title="" data-original-title="Введите сумму цифр">
								</div>
							</div>
							<div class="form-group">
								<div class="col-sm-offset-4 col-sm-7">
									<button id="checkIn" type="submit" class="btn btn-info">Зарегистрироваться</button>
									<button id="cansel" type="button" class="btn btn-default" data-dismiss="modal">Отмена</button>
								</div>
							</div>
				</form>
            </div>
        </div>
        </div>
    </div>
	<!-- Модальное окно для регистрации -->';
}