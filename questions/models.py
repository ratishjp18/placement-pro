from django.db import models


class Section(models.TextChoices):
    QUANT = 'quant', 'Quantitative'
    LOGICAL = 'logical', 'Logical'
    VERBAL = 'verbal', 'Verbal'
    TECHNICAL = 'technical', 'Technical'


class Question(models.Model):
    class Difficulty(models.TextChoices):
        EASY = 'easy', 'Easy'
        MEDIUM = 'medium', 'Medium'
        HARD = 'hard', 'Hard'

    section = models.CharField(max_length=10, choices=Section.choices)
    topic = models.CharField(max_length=100, blank=True)
    difficulty = models.CharField(max_length=10, choices=Difficulty.choices, default=Difficulty.MEDIUM)
    marks = models.DecimalField(max_digits=5, decimal_places=2, default=1)
    text = models.TextField()
    option_a = models.TextField()
    option_b = models.TextField()
    option_c = models.TextField()
    option_d = models.TextField()
    correct_option = models.CharField(max_length=1, choices=[(l, l) for l in 'ABCD'])
    is_active = models.BooleanField(default=True)
    company = models.ForeignKey('accounts.Company', on_delete=models.CASCADE, related_name='questions')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-id']

    def __str__(self):
        return self.text[:60]

    def option_text(self, letter):
        return getattr(self, f'option_{letter.lower()}')
