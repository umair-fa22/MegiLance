# @AI-HINT: Backward-compatibility module alias for legacy `app.api.v1.projects` imports.

import sys
from .projects_domain import projects as _projects_module

sys.modules[__name__] = _projects_module
