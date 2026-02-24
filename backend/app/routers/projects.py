from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.project import Project, ProjectParam
from app.schemas.project import ProjectCreate, ProjectRead, ProjectUpdate

router = APIRouter(prefix="/projects", tags=["projects"])


async def _get_project_or_404(project_id: int, db: AsyncSession) -> Project:
    project = await db.scalar(
        select(Project)
        .options(selectinload(Project.params))
        .where(Project.id == project_id)
    )
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


@router.get("/", response_model=list[ProjectRead])
async def list_projects(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Project).options(selectinload(Project.params)).order_by(Project.id)
    )
    return result.scalars().all()


@router.post("/", response_model=ProjectRead, status_code=status.HTTP_201_CREATED)
async def create_project(data: ProjectCreate, db: AsyncSession = Depends(get_db)):
    project = Project(
        name=data.name,
        start_date=data.start_date,
        end_date=data.end_date,
        currency=data.currency,
    )
    db.add(project)
    await db.flush()

    # Default params
    default_params = {
        "vat_rate": "20",
        "sz_rate": "6",
        "km_rate": "12",
        "shift_hours": "12",
        **data.params,
    }
    for key, value in default_params.items():
        db.add(ProjectParam(project_id=project.id, key=key, value=value))

    await db.commit()
    return await _get_project_or_404(project.id, db)


@router.get("/{project_id}", response_model=ProjectRead)
async def get_project(project_id: int, db: AsyncSession = Depends(get_db)):
    return await _get_project_or_404(project_id, db)


@router.patch("/{project_id}", response_model=ProjectRead)
async def update_project(
    project_id: int, data: ProjectUpdate, db: AsyncSession = Depends(get_db)
):
    project = await _get_project_or_404(project_id, db)
    if data.name is not None:
        project.name = data.name
    if data.start_date is not None:
        project.start_date = data.start_date
    if data.end_date is not None:
        project.end_date = data.end_date
    if data.currency is not None:
        project.currency = data.currency
    if data.params is not None:
        await db.execute(delete(ProjectParam).where(ProjectParam.project_id == project_id))
        for key, value in data.params.items():
            db.add(ProjectParam(project_id=project_id, key=key, value=value))
    await db.commit()
    return await _get_project_or_404(project_id, db)


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project(project_id: int, db: AsyncSession = Depends(get_db)):
    project = await _get_project_or_404(project_id, db)
    await db.delete(project)
    await db.commit()
