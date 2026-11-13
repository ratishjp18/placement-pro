from django.core.management.base import BaseCommand, CommandError

from accounts.models import Company, User


class Command(BaseCommand):
    help = 'Create a company login: python manage.py create_company <username> <email> <password> [--name "Company Name"]'

    def add_arguments(self, parser):
        parser.add_argument('username')
        parser.add_argument('email')
        parser.add_argument('password')
        parser.add_argument('--name', default='')

    def handle(self, *args, **o):
        if User.objects.filter(username=o['username']).exists():
            raise CommandError('That username already exists.')
        user = User.objects.create_user(o['username'], o['email'], o['password'],
                                        role=User.Role.COMPANY, first_name=(o['name'] or o['username'])[:150])
        Company.objects.create(user=user, name=o['name'] or o['username'])
        self.stdout.write(self.style.SUCCESS(f'Company login created: {o["username"]}'))
