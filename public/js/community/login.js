$(document).ready(function () {
	$(".fa-eye").click(function () {
		let input = $('#password');
		let tipoActual = input.attr('type');

		let icon = $('#icon-eye');
		let iconActual = icon.hasClass('fa-eye');

		// Cambiar el tipo de input
		input.attr('type', tipoActual === 'password' ? 'text' : 'password');

		// Cambiar el icono (alternar fa-eye y fa-eye-slash)
		if (iconActual) {
			icon.removeClass('fa-eye').addClass('fa-eye-slash');
		} else {
			icon.removeClass('fa-eye-slash').addClass('fa-eye');
		}
	});
});
