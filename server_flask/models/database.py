from typing import List, Dict, Optional, Any, Tuple
from contextlib import contextmanager
from flask_mysqldb import MySQL


class DatabaseManager:
    """Gestor de operaciones de base de datos con métodos reutilizables"""
    
    def __init__(self, mysql: MySQL):
        self.mysql = mysql
    
    @contextmanager
    def get_cursor(self, dictionary=True):
        """
        Context manager para manejar cursores de forma segura
        
        Usage:
            with db.get_cursor() as cur:
                cur.execute("SELECT * FROM tabla")
                results = cur.fetchall()
        """
        cursor = self.mysql.connection.cursor()
        try:
            yield cursor
            self.mysql.connection.commit()
        except Exception as e:
            self.mysql.connection.rollback()
            raise e
        finally:
            cursor.close()
    
    def execute_query(self, query: str, params: tuple = None, fetch_one: bool = False) -> Optional[Any]:
        """
        Ejecuta una query de consulta (SELECT)
        
        Args:
            query: Query SQL
            params: Parámetros de la query
            fetch_one: Si True retorna un solo registro, si False retorna todos
        
        Returns:
            Resultado de la query o None
        """
        with self.get_cursor() as cur:
            cur.execute(query, params or ())
            return cur.fetchone() if fetch_one else cur.fetchall()
    
    def execute_update(self, query: str, params: tuple = None) -> int:
        """
        Ejecuta una query de modificación (INSERT, UPDATE, DELETE)
        
        Args:
            query: Query SQL
            params: Parámetros de la query
        
        Returns:
            Número de filas afectadas
        """
        with self.get_cursor() as cur:
            cur.execute(query, params or ())
            return cur.rowcount
    
    def execute_insert(self, query: str, params: tuple = None) -> int:
        """
        Ejecuta un INSERT y retorna el ID generado
        
        Args:
            query: Query SQL INSERT
            params: Parámetros de la query
        
        Returns:
            ID del registro insertado
        """
        with self.get_cursor() as cur:
            cur.execute(query, params or ())
            return cur.lastrowid
    
    def exists(self, table: str, field: str, value: Any) -> bool:
        """
        Verifica si existe un registro con el valor dado
        
        Args:
            table: Nombre de la tabla
            field: Campo a verificar
            value: Valor a buscar
        
        Returns:
            True si existe, False si no
        """
        query = f"SELECT 1 FROM {table} WHERE {field} = %s LIMIT 1"
        result = self.execute_query(query, (value,), fetch_one=True)
        return result is not None
    
    def get_by_id(self, table: str, record_id: int, fields: str = "*") -> Optional[tuple]:
        """
        Obtiene un registro por su ID
        
        Args:
            table: Nombre de la tabla
            record_id: ID del registro
            fields: Campos a seleccionar (default: "*")
        
        Returns:
            Tupla con los datos o None
        """
        query = f"SELECT {fields} FROM {table} WHERE id = %s"
        return self.execute_query(query, (record_id,), fetch_one=True)
    
    def get_all(self, table: str, fields: str = "*", where: str = "", params: tuple = None) -> List[tuple]:
        """
        Obtiene todos los registros de una tabla
        
        Args:
            table: Nombre de la tabla
            fields: Campos a seleccionar
            where: Cláusula WHERE opcional
            params: Parámetros para la cláusula WHERE
        
        Returns:
            Lista de tuplas con los registros
        """
        query = f"SELECT {fields} FROM {table}"
        if where:
            query += f" WHERE {where}"
        return self.execute_query(query, params)
    
    def insert(self, table: str, data: Dict[str, Any]) -> int:
        """
        Inserta un registro en la tabla
        
        Args:
            table: Nombre de la tabla
            data: Diccionario con los campos y valores
        
        Returns:
            ID del registro insertado
        """
        fields = ', '.join(data.keys())
        placeholders = ', '.join(['%s'] * len(data))
        query = f"INSERT INTO {table} ({fields}) VALUES ({placeholders})"
        return self.execute_insert(query, tuple(data.values()))
    
    def update(self, table: str, record_id: int, data: Dict[str, Any]) -> int:
        """
        Actualiza un registro por su ID
        
        Args:
            table: Nombre de la tabla
            record_id: ID del registro
            data: Diccionario con los campos a actualizar
        
        Returns:
            Número de filas afectadas
        """
        set_clause = ', '.join([f"{key} = %s" for key in data.keys()])
        query = f"UPDATE {table} SET {set_clause} WHERE id = %s"
        params = tuple(data.values()) + (record_id,)
        return self.execute_update(query, params)
    
    def delete(self, table: str, record_id: int) -> int:
        """
        Elimina un registro por su ID
        
        Args:
            table: Nombre de la tabla
            record_id: ID del registro
        
        Returns:
            Número de filas afectadas
        """
        query = f"DELETE FROM {table} WHERE id = %s"
        return self.execute_update(query, (record_id,))
    
    def search(self, table: str, search_fields: Dict[str, Any], 
               select_fields: str = "*", operator: str = "LIKE") -> List[tuple]:
        """
        Busca registros que coincidan con los criterios
        
        Args:
            table: Nombre de la tabla
            search_fields: Diccionario con campos y valores a buscar
            select_fields: Campos a seleccionar
            operator: Operador de comparación (LIKE, =, >, etc.)
        
        Returns:
            Lista de tuplas con los registros encontrados
        """
        conditions = []
        params = []
        
        for field, value in search_fields.items():
            if operator == "LIKE":
                conditions.append(f"{field} LIKE %s")
                params.append(f"%{value}%")
            else:
                conditions.append(f"{field} {operator} %s")
                params.append(value)
        
        where_clause = " AND ".join(conditions)
        query = f"SELECT {select_fields} FROM {table} WHERE {where_clause}"
        
        return self.execute_query(query, tuple(params))


class ClienteModel:
    """Modelo de datos para la tabla clientes"""
    
    TABLE = 'clientes'
    FIELDS = 'id, nombre, edad, ocupacion, correo, telefono'
    
    def __init__(self, db: DatabaseManager):
        self.db = db
    
    def get_by_email(self, email: str) -> Optional[tuple]:
        """Obtiene un cliente por su email"""
        query = f"SELECT {self.FIELDS} FROM {self.TABLE} WHERE correo = %s"
        return self.db.execute_query(query, (email,), fetch_one=True)
    
    def email_exists(self, email: str) -> bool:
        """Verifica si un email ya está registrado"""
        return self.db.exists(self.TABLE, 'correo', email)
    
    def create(self, data: Dict[str, Any]) -> int:
        """Crea un nuevo cliente"""
        return self.db.insert(self.TABLE, data)
    
    def update_by_id(self, cliente_id: int, data: Dict[str, Any]) -> int:
        """Actualiza un cliente"""
        return self.db.update(self.TABLE, cliente_id, data)
    
    def get_all(self) -> List[tuple]:
        """Obtiene todos los clientes"""
        return self.db.get_all(self.TABLE, self.FIELDS)
    
    def get_by_id(self, cliente_id: int) -> Optional[tuple]:
        """Obtiene un cliente por ID"""
        return self.db.get_by_id(self.TABLE, cliente_id, self.FIELDS)


class ProfesionalModel:
    """Modelo de datos para la tabla profesional"""
    
    TABLE = 'profesional'
    FIELDS = 'id, nombre, correo, telefono, ocupacion, exp, cv, linkedin, tarifa'
    
    def __init__(self, db: DatabaseManager):
        self.db = db
    
    def get_by_email(self, email: str) -> Optional[tuple]:
        """Obtiene un profesional por su email"""
        query = f"SELECT {self.FIELDS} FROM {self.TABLE} WHERE correo = %s"
        return self.db.execute_query(query, (email,), fetch_one=True)
    
    def email_exists(self, email: str) -> bool:
        """Verifica si un email ya está registrado"""
        return self.db.exists(self.TABLE, 'correo', email)
    
    def create(self, data: Dict[str, Any]) -> int:
        """Crea un nuevo profesional"""
        return self.db.insert(self.TABLE, data)
    
    def update_by_id(self, profesional_id: int, data: Dict[str, Any]) -> int:
        """Actualiza un profesional"""
        return self.db.update(self.TABLE, profesional_id, data)
    
    def delete_by_id(self, profesional_id: int) -> int:
        """Elimina un profesional"""
        return self.db.delete(self.TABLE, profesional_id)
    
    def get_all(self) -> List[tuple]:
        """Obtiene todos los profesionales"""
        return self.db.get_all(self.TABLE, self.FIELDS)
    
    def get_by_id(self, profesional_id: int) -> Optional[tuple]:
        """Obtiene un profesional por ID"""
        return self.db.get_by_id(self.TABLE, profesional_id, self.FIELDS)
    
    def search_by_filters(self, ocupacion: str = None, exp_min: int = None) -> List[tuple]:
        """
        Busca profesionales por ocupación y/o experiencia mínima
        
        Args:
            ocupacion: Ocupación a buscar (búsqueda parcial)
            exp_min: Experiencia mínima en años
        
        Returns:
            Lista de profesionales que cumplen los criterios
        """
        query = f"SELECT {self.FIELDS} FROM {self.TABLE} WHERE 1=1"
        params = []
        
        if ocupacion:
            query += " AND ocupacion LIKE %s"
            params.append(f"%{ocupacion}%")
        
        if exp_min is not None:
            query += " AND exp >= %s"
            params.append(exp_min)
        
        return self.db.execute_query(query, tuple(params))
    
    def get_cv_path(self, profesional_id: int) -> Optional[str]:
        """Obtiene solo la ruta del CV de un profesional"""
        query = f"SELECT cv FROM {self.TABLE} WHERE id = %s"
        result = self.db.execute_query(query, (profesional_id,), fetch_one=True)
        return result[0] if result else None


# Instancia global (se inicializará en app.py)
db_manager = None
cliente_model = None
profesional_model = None


def init_models(mysql: MySQL):
    """
    Inicializa los modelos de base de datos
    Debe llamarse después de inicializar MySQL
    """
    global db_manager, cliente_model, profesional_model
    
    db_manager = DatabaseManager(mysql)
    cliente_model = ClienteModel(db_manager)
    profesional_model = ProfesionalModel(db_manager)