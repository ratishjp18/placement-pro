from django.core.management.base import BaseCommand

from attempts.services import finalize_expired


class Command(BaseCommand):
    help = 'Auto-submit in-progress attempts whose time has run out (run every minute via cron/Task Scheduler).'

    def handle(self, *args, **options):
        self.stdout.write(f'Finalized {finalize_expired()} attempt(s).')
