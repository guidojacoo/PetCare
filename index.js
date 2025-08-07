function mostrar(id) {
    document.querySelectorAll('.pantalla').forEach(p => p.classList.remove('activa'));
    document.getElementById(id).classList.add('activa');
  }
  
  function registrarse() {
    const nombre = document.getElementById('nombre').value.trim();
    const email = document.getElementById('email').value.trim();
    const contrasena = document.getElementById('contrasena').value;
    const confirmar = document.getElementById('confirmar').value;
  
    if (!nombre || !email || !contrasena || !confirmar) {
      alert('Por favor completá todos los campos.');
      return;
    }
  
    if (!validarEmail(email)) {
      alert('El email no es válido.');
      return;
    }
  
    if (contrasena.length < 6) {
      alert('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
  
    if (contrasena !== confirmar) {
      alert('Las contraseñas no coinciden.');
      return;
    }  
    alert('¡Cuenta registrada con éxito!');
  }
  
  function validarEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  }
  