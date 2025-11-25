
import java.util.Scanner;

public class Hangman {
    private static final int MAX_TRIES = 6; // Maximum number of incorrect guesses
    private static final String SECRET_SENTENCE = "HIDDEN MESSAGE"; // Hidden sentence
    private static StringBuilder currentGuess;
    private static int incorrectGuesses;

    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        currentGuess = new StringBuilder();

        // Manually creating the initial guess string with underscores
        for (int i = 0; i < SECRET_SENTENCE.length(); i++) {
            currentGuess.append('_');
        }
        
        incorrectGuesses = 0;

        System.out.println("Welcome to Hangman!");
        System.out.println("Guess the sentence: " + currentGuess);

        while (incorrectGuesses < MAX_TRIES && currentGuess.toString().contains("_")) {
            System.out.print("Enter a letter: ");
            String input = scanner.nextLine().toUpperCase();
            char guess = input.charAt(0);

            if (SECRET_SENTENCE.indexOf(guess) >= 0) {
                revealLetter(guess);
                System.out.println("Good guess! Current sentence: " + currentGuess);
            } else {
                incorrectGuesses++;
                System.out.println("Wrong guess! You have " + (MAX_TRIES - incorrectGuesses) + " tries left.");
                drawHangman();
            }
        }

        if (incorrectGuesses == MAX_TRIES) {
            System.out.println("Game over! The sentence was: " + SECRET_SENTENCE);
        } else {
            System.out.println("Congratulations! You've revealed the sentence: " + currentGuess);
        }

        scanner.close();
    }

    private static void revealLetter(char letter) {
        for (int i = 0; i < SECRET_SENTENCE.length(); i++) {
            if (SECRET_SENTENCE.charAt(i) == letter) {
                currentGuess.setCharAt(i, letter);
            }
        }
    }

    private static void drawHangman() {
        System.out.println("Tree and Hangman:");
        switch (incorrectGuesses) {
            case 1:
                System.out.println("  🌳");
                System.out.println("      | ");
                System.out.println("      O ");
                break;
            case 2:
                System.out.println("  🌳");
                System.out.println("      | ");
                System.out.println("      O ");
                System.out.println("      | ");
                break;
            case 3:
                System.out.println("  🌳");
                System.out.println("      | ");
                System.out.println("      O ");
                System.out.println("     /| ");
                break;
            case 4:
                System.out.println("  🌳");
                System.out.println("      | ");
                System.out.println("      O ");
                System.out.println("     /|\\ ");
                break;
            case 5:
                System.out.println("  🌳");
                System.out.println("      | ");
                System.out.println("      O ");
                System.out.println("     /|\\ ");
                System.out.println("     / ");
                break;
            case 6:
                System.out.println("  🌳");
                System.out.println("      | ");
                System.out.println("      O ");
                System.out.println("     /|\\ ");
                System.out.println("     / \\ ");
                break;
            default:
                break;
        }
    }
}