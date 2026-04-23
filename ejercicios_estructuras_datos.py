# Guía de Ejercicios: Python - Estructuras de Datos y Algoritmia


# 1. Frecuencia de Notas
def frecuencia_notas():
    calificaciones = [7, 8, 7, 10, 9, 8]
    frecuencia = {}
    for nota in calificaciones:
        frecuencia[nota] = frecuencia.get(nota, 0) + 1
    return frecuencia


# 2. Traductor Simple
def traductor_simple():
    diccionario = {
        "hola": "hello",
        "adios": "goodbye",
        "gato": "cat",
        "perro": "dog",
        "casa": "house",
        "agua": "water",
    }
    palabra = input("Ingresa una palabra en español: ").strip().lower()
    if palabra in diccionario:
        print(f"Traducción: {diccionario[palabra]}")
    else:
        print(f"Error: la palabra '{palabra}' no está en el diccionario.")


# 3. Agenda Telefónica
def agenda_telefonica():
    agenda = {
        "Ana": "555-1001",
        "Luis": "555-1002",
        "Andrea": "555-1003",
        "Carlos": "555-1004",
        "Alejandro": "555-1005",
        "Beatriz": "555-1006",
    }
    print("Contactos cuyo nombre empieza con 'A':")
    for nombre, telefono in agenda.items():
        if nombre.startswith("A"):
            print(f"  {nombre}: {telefono}")


# 4. Actualización de Stock
def actualizar_stock():
    inventario = {"camisas": 10, "pantalones": 5}
    nuevas_prendas = ["camisas", "gorras", "camisas"]
    for prenda in nuevas_prendas:
        if prenda in inventario:
            inventario[prenda] += 1
        else:
            inventario[prenda] = 1
    return inventario


# 5. Buscador de Duplicados
def tiene_duplicados(lista):
    return len(lista) != len(set(lista))


# 6. Clubes Deportivos
def clubes_deportivos():
    futbol = {"Carlos", "Ana", "Luis", "Marta", "Pedro"}
    basket = {"Ana", "Jorge", "Marta", "Sofia", "Luis"}
    en_ambos = futbol & basket
    print("Alumnos en Fútbol y Basket:")
    for alumno in en_ambos:
        print(f"  {alumno}")


# 7. Invitados Faltantes
def invitados_faltantes():
    invitados_confirmados = ["Ana", "Luis", "Marta", "Pedro", "Sofia", "Carlos"]
    personas_que_llegaron = {"Ana", "Marta", "Sofia"}
    faltantes = set(invitados_confirmados) - personas_que_llegaron
    print("Invitados que faltaron:")
    for persona in faltantes:
        print(f"  {persona}")


# 8. De Listas a Diccionario
def listas_a_diccionario():
    nombres = ["Ana", "Luis", "Carlos", "Marta"]
    edades = [25, 32, 19, 28]
    resultado = dict(zip(nombres, edades))
    return resultado


# 9. Valores Únicos
def valores_unicos(lista):
    return list(dict.fromkeys(lista))


# 10. Categorizador
def categorizador():
    personas = {
        "Ana": 25,
        "Luis": 16,
        "Carlos": 17,
        "Marta": 30,
        "Pedro": 14,
        "Sofia": 22,
    }
    menores = {nombre for nombre, edad in personas.items() if edad < 18}
    mayores = {nombre for nombre, edad in personas.items() if edad >= 18}
    return menores, mayores


# --- Ejecución de todos los ejercicios ---

if __name__ == "__main__":
    print("=" * 50)
    print("1. Frecuencia de Notas")
    print("=" * 50)
    print(frecuencia_notas())

    print("\n" + "=" * 50)
    print("2. Traductor Simple")
    print("=" * 50)
    traductor_simple()

    print("\n" + "=" * 50)
    print("3. Agenda Telefónica")
    print("=" * 50)
    agenda_telefonica()

    print("\n" + "=" * 50)
    print("4. Actualización de Stock")
    print("=" * 50)
    print(actualizar_stock())

    print("\n" + "=" * 50)
    print("5. Buscador de Duplicados")
    print("=" * 50)
    lista_con_duplicados = [1, 2, 3, 2, 5]
    lista_sin_duplicados = [1, 2, 3, 4, 5]
    print(f"  {lista_con_duplicados} → tiene duplicados: {tiene_duplicados(lista_con_duplicados)}")
    print(f"  {lista_sin_duplicados} → tiene duplicados: {tiene_duplicados(lista_sin_duplicados)}")

    print("\n" + "=" * 50)
    print("6. Clubes Deportivos")
    print("=" * 50)
    clubes_deportivos()

    print("\n" + "=" * 50)
    print("7. Invitados Faltantes")
    print("=" * 50)
    invitados_faltantes()

    print("\n" + "=" * 50)
    print("8. De Listas a Diccionario")
    print("=" * 50)
    print(listas_a_diccionario())

    print("\n" + "=" * 50)
    print("9. Valores Únicos")
    print("=" * 50)
    lista_repetidos = [3, 1, 4, 1, 5, 9, 2, 6, 5, 3, 5]
    print(f"  Original:  {lista_repetidos}")
    print(f"  Sin repeticiones: {valores_unicos(lista_repetidos)}")

    print("\n" + "=" * 50)
    print("10. Categorizador")
    print("=" * 50)
    menores, mayores = categorizador()
    print(f"  Menores de edad: {menores}")
    print(f"  Mayores de edad: {mayores}")
