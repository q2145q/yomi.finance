import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.project import Project
from app.models.user import ProjectUser, User
from app.schemas.project import ProjectCreate, ProjectUpdate, ProjectOut
from app.schemas.user import ProjectUserOut, ProjectUserCreate
from app.routers.deps import CurrentUser

router = APIRouter(prefix="/projects", tags=["projects"])


@router.get("", response_model=list[ProjectOut])
async def list_projects(current_user: CurrentUser, db: AsyncSession = Depends(get_db)):
    """Возвращает проекты, в которых участвует пользователь."""
    if current_user.is_superadmin:
        result = await db.execute(select(Project).order_by(Project.created_at.desc()))
    else:
        result = await db.execute(
            select(Project)
            .join(ProjectUser, ProjectUser.project_id == Project.id)
            .where(ProjectUser.user_id == current_user.id)
            .order_by(Project.created_at.desc())
        )
    return result.scalars().all()


@router.post("", response_model=ProjectOut, status_code=status.HTTP_201_CREATED)
async def create_project(data: ProjectCreate, current_user: CurrentUser, db: AsyncSession = Depends(get_db)):
    project = Project(**data.model_dump())
    db.add(project)
    await db.flush()

    # Создатель автоматически становится продюсером
    pu = ProjectUser(project_id=project.id, user_id=current_user.id, role="PRODUCER")
    db.add(pu)
    await db.commit()
    await db.refresh(project)
    return project


@router.get("/{project_id}", response_model=ProjectOut)
async def get_project(project_id: uuid.UUID, current_user: CurrentUser, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Project).where(Project.id == project_id))
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Проект не найден")

    # Проверяем доступ
    if not current_user.is_superadmin:
        pu_result = await db.execute(
            select(ProjectUser).where(ProjectUser.project_id == project_id, ProjectUser.user_id == current_user.id)
        )
        if not pu_result.scalar_one_or_none():
            raise HTTPException(status_code=403, detail="Нет доступа к проекту")

    return project


@router.patch("/{project_id}", response_model=ProjectOut)
async def update_project(
    project_id: uuid.UUID, data: ProjectUpdate, current_user: CurrentUser, db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Project).where(Project.id == project_id))
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Проект не найден")

    for field, value in data.model_dump(exclude_none=True).items():
        setattr(project, field, value)

    await db.commit()
    await db.refresh(project)
    return project


@router.get("/{project_id}/team", response_model=list[ProjectUserOut])
async def get_team(project_id: uuid.UUID, current_user: CurrentUser, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(ProjectUser).options(selectinload(ProjectUser.user))
        .where(ProjectUser.project_id == project_id)
    )
    return result.scalars().all()


@router.post("/{project_id}/team", response_model=ProjectUserOut, status_code=status.HTTP_201_CREATED)
async def add_team_member(
    project_id: uuid.UUID, data: ProjectUserCreate, current_user: CurrentUser, db: AsyncSession = Depends(get_db)
):
    # Только продюсер может добавлять
    pu_check = await db.execute(
        select(ProjectUser).where(ProjectUser.project_id == project_id, ProjectUser.user_id == current_user.id)
    )
    pu = pu_check.scalar_one_or_none()
    if not current_user.is_superadmin and (not pu or pu.role not in ("PRODUCER", "LINE_PRODUCER")):
        raise HTTPException(status_code=403, detail="Только продюсер может управлять командой")

    new_pu = ProjectUser(project_id=project_id, user_id=data.user_id, role=data.role)
    db.add(new_pu)
    await db.commit()

    result = await db.execute(
        select(ProjectUser).options(selectinload(ProjectUser.user))
        .where(ProjectUser.id == new_pu.id)
    )
    return result.scalar_one()


@router.delete("/{project_id}/team/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_team_member(
    project_id: uuid.UUID, user_id: uuid.UUID, current_user: CurrentUser, db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(ProjectUser).where(ProjectUser.project_id == project_id, ProjectUser.user_id == user_id)
    )
    pu = result.scalar_one_or_none()
    if not pu:
        raise HTTPException(status_code=404, detail="Пользователь не найден в проекте")
    await db.delete(pu)
    await db.commit()
