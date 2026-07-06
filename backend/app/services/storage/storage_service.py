from pathlib import Path
from uuid import uuid4

from fastapi import UploadFile


class StorageService:

    def __init__(self):
        self.upload_dir = Path("uploads")
        self.upload_dir.mkdir(exist_ok=True)

    async def save_file(self, file: UploadFile) -> tuple[str, str]:
        """
        Saves uploaded file.

        Returns:
            filename
            filepath
        """

        extension = Path(file.filename).suffix

        unique_filename = f"{uuid4()}{extension}"

        filepath = self.upload_dir / unique_filename

        with open(filepath, "wb") as f:
            f.write(await file.read())

        return unique_filename, str(filepath)


storage_service = StorageService()