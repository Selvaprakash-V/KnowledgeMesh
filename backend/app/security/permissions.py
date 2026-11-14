ROLES = {"ADMIN", "KNOWLEDGE_MANAGER", "USER"}
MEMBER_ROLES = {"OWNER", "MANAGER", "VIEWER"}
GRAPH_QUERY_TYPES = {"RELATIONSHIP", "COMPARISON", "ANALYTICAL", "MULTI_DOCUMENT"}


def can_create_kb(user) -> bool:
    return user.status == "ACTIVE" and user.role in {"ADMIN", "KNOWLEDGE_MANAGER"}


def can_read_kb(user, kb, membership) -> bool:
    if user.status != "ACTIVE":
        return False
    if user.role == "ADMIN":
        return True
    if kb.owner_id == user.id:
        return True
    if membership is not None:
        return True
    return kb.visibility == "INTERNAL"


def can_manage_kb(user, kb, membership) -> bool:
    if user.status != "ACTIVE":
        return False
    if user.role == "ADMIN":
        return True
    if kb.owner_id == user.id:
        return True
    return membership is not None and membership.role in {"OWNER", "MANAGER"}


def can_delete_kb(user, kb) -> bool:
    if user.status != "ACTIVE":
        return False
    return user.role == "ADMIN" or kb.owner_id == user.id
