from datetime import timedelta

from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from accounts.models import Company, User
from exams.forms import ExamForm
from exams.models import Exam
from questions.models import Question

# (section, topic, difficulty, text, A, B, C, D, correct)
QUESTIONS = [
    # Quantitative
    ('quant', 'Percentages', 'easy', 'What is 20% of 150?', '20', '25', '30', '35', 'C'),
    ('quant', 'Ratios', 'easy', 'Divide 120 in the ratio 2:3. What is the larger share?', '48', '60', '72', '80', 'C'),
    ('quant', 'Time and Work', 'medium', 'A can finish a job in 10 days and B in 15 days. Working together, how many days do they need?', '5', '6', '7', '8', 'B'),
    ('quant', 'Profit and Loss', 'medium', 'An item bought for 800 is sold for 1000. What is the profit percentage?', '20%', '22.5%', '25%', '30%', 'C'),
    ('quant', 'Speed and Distance', 'easy', 'A car travels 180 km in 3 hours. What is its speed in km/h?', '50', '55', '60', '65', 'C'),
    ('quant', 'Averages', 'easy', 'What is the average of 10, 20, 30, 40 and 50?', '25', '30', '35', '40', 'B'),
    ('quant', 'Simple Interest', 'medium', 'Simple interest on 5000 at 8% per annum for 3 years is?', '1000', '1200', '1400', '1600', 'B'),
    ('quant', 'Number Series', 'medium', 'Find the next number: 2, 6, 12, 20, 30, ?', '40', '42', '44', '46', 'B'),
    ('quant', 'Permutations', 'hard', 'In how many ways can the letters of the word "CAT" be arranged?', '3', '6', '9', '12', 'B'),
    ('quant', 'Algebra', 'hard', 'If x + 1/x = 3, what is x^2 + 1/x^2?', '5', '7', '9', '11', 'B'),
    # Logical
    ('logical', 'Series', 'easy', 'Find the odd one out: 2, 4, 8, 16, 18, 32', '4', '8', '18', '32', 'C'),
    ('logical', 'Coding-Decoding', 'medium', 'If CAT is coded as DBU, how is DOG coded?', 'EPH', 'EPI', 'FPH', 'DPH', 'A'),
    ('logical', 'Blood Relations', 'medium', 'Pointing to a man, Ravi says "He is the son of my mother\'s only son." How is the man related to Ravi?', 'Brother', 'Son', 'Nephew', 'Father', 'B'),
    ('logical', 'Directions', 'easy', 'A man walks 5 km north, then 5 km east. In which direction is he from the start?', 'North-East', 'South-East', 'North-West', 'East', 'A'),
    ('logical', 'Syllogism', 'medium', 'All cats are animals. All animals are living things. Which is certainly true?', 'All living things are cats', 'All cats are living things', 'Some animals are not cats', 'No cat is living', 'B'),
    ('logical', 'Ranking', 'easy', 'In a row of 20 students, Asha is 8th from the left. What is her position from the right?', '12th', '13th', '14th', '11th', 'B'),
    ('logical', 'Analogy', 'easy', 'Book : Reader :: Food : ?', 'Cook', 'Eater', 'Plate', 'Hunger', 'B'),
    ('logical', 'Clocks', 'hard', 'What is the angle between the hands of a clock at 3:00?', '60 degrees', '75 degrees', '90 degrees', '120 degrees', 'C'),
    ('logical', 'Calendar', 'hard', 'If today is Monday, what day will it be after 100 days?', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'C'),
    ('logical', 'Number Puzzle', 'medium', 'If 3 pens cost 45, what is the cost of 7 pens?', '95', '100', '105', '110', 'C'),
    # Verbal
    ('verbal', 'Synonyms', 'easy', 'Choose the synonym of "rapid".', 'Slow', 'Quick', 'Late', 'Calm', 'B'),
    ('verbal', 'Antonyms', 'easy', 'Choose the antonym of "ancient".', 'Old', 'Modern', 'Historic', 'Classic', 'B'),
    ('verbal', 'Grammar', 'medium', 'Choose the correct sentence.', 'She don\'t like tea.', 'She doesn\'t likes tea.', 'She doesn\'t like tea.', 'She not like tea.', 'C'),
    ('verbal', 'Fill in the Blank', 'easy', 'He is good ___ mathematics.', 'in', 'at', 'on', 'with', 'B'),
    ('verbal', 'Spelling', 'medium', 'Choose the correctly spelt word.', 'Accomodate', 'Acommodate', 'Accommodate', 'Acomodate', 'C'),
    ('verbal', 'Idioms', 'medium', '"Break the ice" means:', 'Destroy something', 'Start a conversation', 'Feel cold', 'Make a mistake', 'B'),
    ('verbal', 'One Word', 'medium', 'One who knows everything is:', 'Omnipotent', 'Omniscient', 'Omnipresent', 'Optimist', 'B'),
    ('verbal', 'Tenses', 'easy', 'By next year, I ___ my degree.', 'will complete', 'will have completed', 'completed', 'am completing', 'B'),
    ('verbal', 'Voice', 'hard', 'Change to passive: "The chef cooked the meal."', 'The meal is cooked by the chef.', 'The meal was cooked by the chef.', 'The meal has cooked the chef.', 'The chef was cooked by the meal.', 'B'),
    ('verbal', 'Articles', 'easy', 'She is ___ honest girl.', 'a', 'an', 'the', 'no article', 'B'),
    # Technical
    ('technical', 'Data Structures', 'easy', 'Which data structure works on the LIFO principle?', 'Queue', 'Stack', 'Array', 'Tree', 'B'),
    ('technical', 'Complexity', 'medium', 'What is the time complexity of binary search on a sorted array?', 'O(n)', 'O(log n)', 'O(n log n)', 'O(1)', 'B'),
    ('technical', 'DBMS', 'easy', 'Which SQL command is used to retrieve data from a table?', 'GET', 'SELECT', 'FETCH', 'OPEN', 'B'),
    ('technical', 'OOP', 'medium', 'Which OOP concept lets a child class reuse the members of a parent class?', 'Encapsulation', 'Polymorphism', 'Inheritance', 'Abstraction', 'C'),
    ('technical', 'Networks', 'medium', 'Which protocol is used to load web pages securely?', 'HTTP', 'FTP', 'HTTPS', 'SMTP', 'C'),
    ('technical', 'Operating Systems', 'medium', 'Which scheduling algorithm gives each process a fixed time slice?', 'FCFS', 'Round Robin', 'SJF', 'Priority', 'B'),
    ('technical', 'Python', 'easy', 'What is the output of len([1, 2, 3, 4])?', '3', '4', '5', 'Error', 'B'),
    ('technical', 'Sorting', 'hard', 'Which sorting algorithm has O(n log n) worst-case time?', 'Quick sort', 'Bubble sort', 'Merge sort', 'Insertion sort', 'C'),
    ('technical', 'DBMS', 'hard', 'Which normal form removes transitive dependencies?', '1NF', '2NF', '3NF', 'BCNF only', 'C'),
    ('technical', 'Memory', 'medium', 'Which memory is the fastest?', 'Hard disk', 'RAM', 'Cache', 'Pen drive', 'C'),
]


class Command(BaseCommand):
    help = 'Create demo data: 1 company, 5 students, 40 questions (owned by the company) and a sample exam.'

    @transaction.atomic
    def handle(self, *args, **options):
        company_user, _ = User.objects.get_or_create(
            username='acme', defaults={'role': 'company', 'first_name': 'SOLO CORP', 'email': 'acme@example.com'})
        company_user.set_password('company123')
        company_user.save()
        company, _ = Company.objects.get_or_create(
            user=company_user, defaults={'name': 'SOLO CORP', 'contact_person': 'Hiring Team'})

        for i in range(1, 6):
            student, _ = User.objects.get_or_create(
                username=f'student{i}',
                defaults={'role': 'student', 'first_name': 'Student', 'last_name': str(i),
                          'roll_number': f'R{i:03d}', 'email': f'student{i}@example.com'})
            student.set_password('student123')
            student.save()

        created = 0
        for sec, topic, diff, text, a, b, c, d, correct in QUESTIONS:
            _, new = Question.objects.get_or_create(
                company=company, text=text, section=sec,
                defaults=dict(topic=topic, difficulty=diff, marks=1, option_a=a, option_b=b,
                              option_c=c, option_d=d, correct_option=correct, company=company))
            created += new

        if not Exam.objects.filter(company=company, title='Sample Aptitude Test').exists():
            now = timezone.now()
            form = ExamForm(company=company, data={
                'title': 'Sample Aptitude Test', 'duration_minutes': 30,
                'start_time': (now - timedelta(minutes=5)).strftime('%Y-%m-%dT%H:%M'),
                'end_time': (now + timedelta(days=7)).strftime('%Y-%m-%dT%H:%M'),
                'is_published': 'on',
                'count_quant': 8, 'count_logical': 8, 'count_verbal': 7, 'count_technical': 7,
            })
            if form.is_valid():
                form.save()
            else:
                self.stderr.write(f'Could not create sample exam: {form.errors.as_json()}')

        self.stdout.write(self.style.SUCCESS(f'Seeded ({created} new questions).'))
        self.stdout.write('Logins -> acme@example.com / company123 (company), student1@example.com .. student5@example.com / student123 (students)')
