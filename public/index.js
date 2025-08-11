function mostrar(id) {
  document.querySelectorAll('.pantalla').forEach(p => p.classList.remove('activa'));
  document.getElementById(id).classList.add('activa');
}

function registrarse() {
  const nombre = document.getElementById('nombre');
  const email = document.getElementById('email');
  const contrasena = document.getElementById('contrasena');
  const confirmar = document.getElementById('confirmar');
  const mensajeExito = document.getElementById('mensaje-exito');

  limpiarErrores();
  mensajeExito.textContent = '';

  let valido = true;

  if (nombre.value.trim() === '') {
    mostrarError(nombre, 'Completa tu nombre', 'error-nombre');
    valido = false;
  }

  if (email.value.trim() === '') {
    mostrarError(email, 'Completa tu email', 'error-email');
    valido = false;
  } else if (!validarEmail(email.value.trim())) {
    mostrarError(email, 'El email no es válido', 'error-email');
    valido = false;
  }

  if (contrasena.value.trim() === '') {
    mostrarError(contrasena, 'Ingresá una contraseña', 'error-contrasena');
    valido = false;
  } else if (contrasena.value.length < 6) {
    mostrarError(contrasena, 'La contraseña debe tener al menos 6 caracteres', 'error-contrasena');
    valido = false;
  }

  if (confirmar.value.trim() === '') {
    mostrarError(confirmar, 'Repetí tu contraseña', 'error-confirmar');
    valido = false;
  } else if (confirmar.value !== contrasena.value) {
    mostrarError(confirmar, 'Las contraseñas no coinciden', 'error-confirmar');
    valido = false;
  }

  if (valido) {
    mensajeExito.textContent = '¡Cuenta registrada con éxito!';
    nombre.value = '';
    email.value = '';
    contrasena.value = '';
    confirmar.value = '';
    setTimeout(() => {
      mostrar('pantalla-principal');
    }, 1000);
  }
}

function validarEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

function mostrarError(input, mensaje, idError) {
  input.classList.add('input-error');
  document.getElementById(idError).textContent = mensaje;
}

function limpiarErrores() {
  document.querySelectorAll('.error').forEach(e => e.textContent = '');
  document.querySelectorAll('input').forEach(input => input.classList.remove('input-error'));
}

function togglePassword(idInput, boton) {
  const input = document.getElementById(idInput);
  const emoji = boton;

  if (input.type === 'password') {
    input.type = 'text';
    emoji.textContent = '🙈';
  } else {
    input.type = 'password';
    emoji.textContent = '👁️';
  }
}

function iniciarSesion() {
  const usuarioLogin = document.getElementById('usuario-login');
  const mensajeLogin = document.getElementById('mensaje-login');

  mensajeLogin.textContent = '';
  usuarioLogin.classList.remove('input-error');

  if (usuarioLogin.value.trim() === '') {
    usuarioLogin.classList.add('input-error');
    mensajeLogin.textContent = 'Ingresá tu usuario o email';
    mensajeLogin.style.color = 'red';
  } else {
    mensajeLogin.textContent = '¡Sesión iniciada con éxito!';
    mensajeLogin.style.color = 'green';
    usuarioLogin.value = '';
    setTimeout(() => {
      mostrar('pantalla-principal');
    }, 1000);
  }
}
