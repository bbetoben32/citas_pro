import os
import time
from werkzeug.utils import secure_filename
from flask import current_app


class FileService:
    
    UPLOAD_SUBDIR = os.path.join('uploads', 'cvs')
    ALLOWED_EXTENSIONS = {'pdf'}
    ALLOWED_IMAGE_EXTENSIONS = {'jpg', 'jpeg', 'png', 'webp'}
    
    @classmethod
    def is_allowed_file(cls, filename: str, file_type: str = 'pdf') -> bool:
        if not '.' in filename:
            return False
        
        ext = filename.rsplit('.', 1)[1].lower()
        
        if file_type == 'pdf':
            return ext in cls.ALLOWED_EXTENSIONS
        elif file_type == 'image':
            return ext in cls.ALLOWED_IMAGE_EXTENSIONS
        
        return False
    
    @classmethod
    def get_upload_directory(cls, file_type: str = 'pdf') -> str:
        if file_type == 'image':
            base = os.path.join(current_app.root_path, 'uploads', 'fotos')
        else:
            base = os.path.join(current_app.root_path, cls.UPLOAD_SUBDIR)
        
        os.makedirs(base, exist_ok=True)
        return base
    
    @classmethod
    def get_public_path(cls, filename: str, file_type: str = 'pdf') -> str:
        if file_type == 'image':
            subdir = os.path.join('uploads', 'fotos')
        else:
            subdir = cls.UPLOAD_SUBDIR
        
        return ("/" + "/".join([*subdir.split(os.sep), filename])).replace("\\", "/")
    
    @classmethod
    def save_file(cls, file, prefix: str = "", file_type: str = 'pdf') -> tuple[str, str]:
        if not file or not file.filename:
            return None, None
        
        if not cls.is_allowed_file(file.filename, file_type):
            if file_type == 'image':
                raise ValueError('Solo se permiten imágenes JPG, PNG o WEBP')
            else:
                raise ValueError('Solo se permiten archivos PDF')
        
        filename = secure_filename(file.filename)
        if prefix:
            filename = f"{prefix}_{int(time.time())}_{filename}"
        else:
            filename = f"{int(time.time())}_{filename}"
        
        base_dir = cls.get_upload_directory(file_type)
        absolute_path = os.path.join(base_dir, filename)
        file.save(absolute_path)
        
        public_path = cls.get_public_path(filename, file_type)
        return absolute_path, public_path
    
    @classmethod
    def delete_file(cls, filepath: str):
        if filepath and os.path.exists(filepath):
            os.remove(filepath)


file_service = FileService()