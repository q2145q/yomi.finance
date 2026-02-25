"""Зависимости FastAPI: получение текущего пользователя, проверка прав."""
import uuid
from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.security import decode_token
from app.database import get_db
from app.models.user import User, ProjectUser

bearer = HTTPBearer()


async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(bearer)],
    db: AsyncSession = Depends(get_db),
) -> User:
    token = credentials.credentials
    try:
        payload = decode_token(token)
        if payload.get("type") != "access":
            raise JWTError("wrong token type")
        user_id = payload.get("sub")
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Недействительный токен")

    result = await db.execute(select(User).where(User.id == uuid.UUID(user_id)))
    user = result.scalar_one_or_none()
    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Пользователь не найден")
    return user


CurrentUser = Annotated[User, Depends(get_current_user)]


async def get_project_role(
    project_id: uuid.UUID,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
) -> str:
    """Возвращает роль пользователя в проекте или 404."""
    if current_user.is_superadmin:
        return "PRODUCER"
    result = await db.execute(
        select(ProjectUser).where(
            ProjectUser.project_id == project_id,
            ProjectUser.user_id == current_user.id,
        )
    )
    pu = result.scalar_one_or_none()
    if not pu:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Нет доступа к проекту")
    return pu.role


def require_roles(*roles: str):
    """Декоратор-зависимость для проверки роли."""
    async def check_role(role: str = Depends(get_project_role)):
        if role not in roles:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Недостаточно прав")
        return role
    return check_role
