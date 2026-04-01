from app.models.user import User

def get_missing_profile_fields(user: User) -> list[str]:
    missing = []
    if not user:
        return ['user']
    if not user.first_name and not user.name:
        missing.append('name')
    return missing

def is_profile_complete(user: User) -> bool:
    return len(get_missing_profile_fields(user)) == 0
