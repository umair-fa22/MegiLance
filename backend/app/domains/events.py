import asyncio
import logging
from typing import Dict, List, Callable, Any

logger = logging.getLogger(__name__)

class EventBus:
    _listeners: Dict[str, List[Callable]] = {}

    @classmethod
    def subscribe(cls, event_type: str, callback: Callable):
        if event_type not in cls._listeners:
            cls._listeners[event_type] = []
        cls._listeners[event_type].append(callback)
        logger.debug(f'Subscribed to {event_type}')

    @classmethod
    def publish(cls, event_type: str, payload: Any):
        if event_type in cls._listeners:
            for callback in cls._listeners[event_type]:
                asyncio.create_task(cls._execute(callback, payload))

    @staticmethod
    async def _execute(callback: Callable, payload: Any):
        try:
            if asyncio.iscoroutinefunction(callback):
                await callback(payload)
            else:
                callback(payload)
        except Exception as e:
            logger.error(f'Error executing event handler: {e}')

event_bus = EventBus()
