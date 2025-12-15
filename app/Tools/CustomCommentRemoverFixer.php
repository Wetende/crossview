<?php

declare(strict_types=1);

namespace App\Tools;

use PhpCsFixer\AbstractFixer;
use PhpCsFixer\Fixer\ConfigurableFixerInterface;
use PhpCsFixer\FixerDefinition\CodeSample;
use PhpCsFixer\FixerDefinition\FixerDefinition;
use PhpCsFixer\FixerDefinition\FixerDefinitionInterface;
use PhpCsFixer\Tokenizer\Tokens;
use PhpCsFixer\FixerConfiguration\FixerConfigurationResolver;
use PhpCsFixer\FixerConfiguration\FixerConfigurationResolverInterface;
use PhpCsFixer\FixerConfiguration\FixerOptionBuilder;
use Symfony\Component\OptionsResolver\OptionsResolver;

final class CustomCommentRemoverFixer extends AbstractFixer implements ConfigurableFixerInterface
{
    private array $preservePatterns = [];

    public function configure(array $configuration): void
    {
        $resolver = new OptionsResolver();
        $resolver->setDefaults([
            'preserve_patterns' => [],
        ]);
        $resolver->setAllowedTypes('preserve_patterns', 'array');

        $resolvedConfig = $resolver->resolve($configuration);
        $this->preservePatterns = $resolvedConfig['preserve_patterns'];
    }

    public function getConfigurationDefinition(): FixerConfigurationResolverInterface
    {
        $preservePatternsOption = (new FixerOptionBuilder('preserve_patterns', 'List of regex patterns for comments to preserve'))
            ->setAllowedTypes(['array'])
            ->setDefault([])
            ->getOption();

        return new FixerConfigurationResolver([$preservePatternsOption]);
    }

    public function getDefinition(): FixerDefinitionInterface
    {
        return new FixerDefinition(
            'Removes useless comments like redundant PHPDoc blocks, obvious inline comments, etc.',
            [
                new CodeSample(
                    '<?php
/**
 * The class name.
 *
 * @var string
 */
protected $name;

/**
 * Constructor.
 */
public function __construct()
{
    // Initialize
    $this->initialize();
}
'
                ),
                new CodeSample(
                    '<?php
/**
 * The class name.
 *
 * @var string
 */
protected $name;

/**
 * Constructor.
 */
public function __construct()
{
    // Initialize
    $this->initialize();
}
',
                    ['preserve_patterns' => ['/TODO|FIXME/i']]
                ),
            ]
        );
    }

    public function isCandidate(Tokens $tokens): bool
    {
        return $tokens->isTokenKindFound(T_COMMENT) || $tokens->isTokenKindFound(T_DOC_COMMENT);
    }

    public function getName(): string
    {
        return 'CrossViewCollege/comment_remover';
    }

    public function getPriority(): int
    {
        return -50;
    }

    protected function applyFix(\SplFileInfo $file, Tokens $tokens): void
    {
        foreach ($tokens as $index => $token) {
            if (!$token->isComment()) {
                continue;
            }

            $content = $token->getContent();


            if ($token->isGivenKind(T_COMMENT) && str_starts_with($content, '//')) {
                $tokens->clearAt($index);
                continue;
            }





            foreach ($this->preservePatterns as $pattern) {
                if (preg_match($pattern, $content)) {
                    continue 2;
                }
            }


            if ($token->isGivenKind(T_DOC_COMMENT) && $this->isUselessPHPDoc($content, $index, $tokens)) {
                $tokens->clearAt($index);
                continue;
            }
        }
    }

    private function isUselessPHPDoc(string $content, int $index, Tokens $tokens): bool
    {
        if (trim($content) === '/** */' || trim($content) === '/***/') {
            return true;
        }
        return false;
    }
}
